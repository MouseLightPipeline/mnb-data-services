import * as fs from "fs-extra";
import * as path from "path";
import * as _ from "lodash";
import * as yargs from "yargs";
import {hideBin} from "yargs/helpers";
import * as progress from "cli-progress";
import {ServiceOptions} from "../options/serviceOptions";

import {MouseStrain} from "../models/sample/mouseStrain";
import {Sample} from "../models/sample/sample";
import {InjectionVirus} from "../models/sample/injectionVirus";
import {Fluorophore} from "../models/sample/fluorophore";
import {BrainArea} from "../models/sample/brainArea";
import {Injection} from "../models/sample/injection";
import {Neuron} from "../models/sample/neuron";
import {SwcTracing} from "../models/swc/swcTracing";
import {TracingStructure, TracingStructureId} from "../models/swc/tracingStructure";
import {Tracing} from "../models/transform/tracing";
import {TracingNode} from "../models/transform/tracingNode";
import {StructureIdentifier, StructureIdentifiers} from "../models/swc/structureIdentifier";
import {RemoteDatabaseClient} from "../models/remoteDatabaseClient";
import {DatabaseOptions} from "../options/databaseOptions";
import {ShareVisibility} from "../optimize/SearchOptimization";

const debug = require("debug")("mnb:data:export");

export enum CcfVersion {
    Ccf25,
    Ccf30
}

type CcfVersionName = "Ccf25" | "Ccf30";
const CcfVersionNames: ReadonlyArray<CcfVersionName> = ["Ccf25", "Ccf30"];

export enum Visibility {
    Internal,
    Public
}

type VisibilityName = "Public" | "Internal";
const VisibilityNames: ReadonlyArray<VisibilityName> = ["Public", "Internal"];

const argv = yargs(hideBin(process.argv))
    .options({
        outputLocation: {type: "string", default: ServiceOptions.exportPath},
        ccfVersion: {choices: CcfVersionNames, default: CcfVersion[CcfVersion.Ccf25]},
        visibility: {choices: VisibilityNames, default: Visibility[Visibility.Public]},
        neuron: {type: "string", default: null}
    }).parseSync();

debug(`output to location: ${argv.outputLocation}`);
debug(`ccf version: ${argv.ccfVersion}`);
debug(`visibility: ${argv.visibility}`);

const pathStructureMap = new Map<string, number>();
const brainAreaMap = new Map<string, BrainArea>();
const brainAreaStructureIdMap = new Map<number, BrainArea>();
const neuronTracingMap = new Map<string, Tracing[]>();
const tracingStructureMap = new Map<string, string>();

let axonId: string = null;
let dendriteId: string = null;
let somaId: string = null;

generateContents(argv.outputLocation, CcfVersion[argv.ccfVersion], Visibility[argv.visibility], argv.neuron).then();

export async function generateContents(outputLocation: string, version: CcfVersion, minVisibility: Visibility, neuron: string) {
    const isCcfv3 = version === CcfVersion.Ccf30;

    const swcFolder = "swc" + (isCcfv3 ? "30" : "25");
    const jsonFolder = "json" + (isCcfv3 ? "30" : "25");

    try {
        await RemoteDatabaseClient.Start("sample", DatabaseOptions.sample);
        await RemoteDatabaseClient.Start("swc", DatabaseOptions.swc);
        await RemoteDatabaseClient.Start("transform", DatabaseOptions.transform);

        try {
            await fs.ensureDir(path.join(outputLocation, swcFolder));
            await fs.ensureDir(path.join(outputLocation, jsonFolder));
        } catch (err) {
            console.log(err);
            return;
        }

        debug("load constants");

        let s = await TracingStructure.findOne({where: {value: TracingStructureId.axon}});
        pathStructureMap.set(s.id, 2);
        axonId = s.id;
        s = await TracingStructure.findOne({where: {value: TracingStructureId.dendrite}});
        pathStructureMap.set(s.id, 3);
        dendriteId = s.id;

        const soma = await StructureIdentifier.findOne({where: {value: StructureIdentifiers.soma}});
        somaId = soma.id;

        debug("load brain areas");

        const brainAreas: BrainArea[] = await BrainArea.findAll({});

        brainAreas.map(b => {
            brainAreaMap.set(b.id, b);
            brainAreaStructureIdMap.set(b.structureId, b);
        });

        debug("load tracings");

        const tracings = await Tracing.findAll();

        let bar = new progress.SingleBar({}, progress.Presets.shades_classic);

        bar.start(tracings.length, 0);

        await tracings.reduce(async (p, t) => {
            await p;

            const swcTracing = await SwcTracing.findOne({where: {id: t.swcTracingId}});

            if (!swcTracing) {
                return;
            }

            tracingStructureMap.set(t.id, swcTracing.tracingStructureId);

            if (neuronTracingMap.has(swcTracing.neuronId)) {
                neuronTracingMap.get(swcTracing.neuronId).push(t);
            } else {
                neuronTracingMap.set(swcTracing.neuronId, [t]);
            }

            bar.increment();

            return true;
        }, Promise.resolve(true));

        bar.stop();

        debug("load neurons");

        let neurons: Neuron[] = [];

        if (neuron) {
            neurons = [await Neuron.findByPk(neuron, {
                include: [{
                    model: Injection,
                    as: "injection",
                    include: [{
                        model: Sample,
                        as: "sample"
                    }]
                }],
                order: ["idString"]
            })];
        } else {
            neurons = await Neuron.findAll({
                include: [{
                    model: Injection,
                    as: "injection",
                    include: [{
                        model: Sample,
                        as: "sample"
                    }]
                }],
                order: ["idString"]
            });

            debug(`found ${neurons.length} input neurons`);

            const shareMinVisibility = minVisibility === Visibility.Public ? ShareVisibility.ShareAllExternal : ShareVisibility.DoNotShare;

            neurons = neurons.filter(n => {
                const visibility = n.sharing === ShareVisibility.Inherited ? n.injection.sample.sharing : n.sharing;

                return visibility >= shareMinVisibility;
            });

            debug(`${neurons.length} neurons meet visibility requirements`);
        }

        bar = new progress.SingleBar({}, progress.Presets.shades_classic);

        bar.start(neurons.length, 0);

        await neurons.reduce(async (p, n) => {
            await p;
            // debug(`${n.idString}:\t${n.id}`);
            await processNeuron(n, outputLocation, swcFolder, jsonFolder, isCcfv3);

            bar.increment();
        }, Promise.resolve());

        bar.stop();

        debug(`finished processing`);

    } catch (err) {
        debug(err);
    }
}

async function processNeuron(neuron: Neuron, outputLocation: string, swcSubdir: string, jsonSubdir: string, isCcfv3: boolean) {
    const relNeuron = await Neuron.findByPk(neuron.id);

    const injection = await Injection.findByPk(relNeuron.injectionId);

    const fluorophore = await Fluorophore.findByPk(injection.fluorophoreId);

    const injectionVirus = await InjectionVirus.findByPk(injection.injectionVirusId);

    const sample = await Sample.findByPk(injection.sampleId);

    const mouse = await MouseStrain.findByPk(sample.mouseStrainId);

    // ---

    const tracings: Tracing[] = neuronTracingMap.get(neuron.id);

    if (!tracings || tracings.length === 0) {
        debug(`skipping neuron ${neuron.idString} for zero tracings`)
        return;
    }

    let axon: Tracing = null;
    let dendrite: Tracing = null;

    for (let tracing of tracings) {
        const structure = tracingStructureMap.get(tracing.id);

        if (structure == axonId) {
            axon = tracing;
        } else if (structure == dendriteId) {
            dendrite = tracing;
        }
    }

    let soma = axon != null ? await TracingNode.findOne({
        where: {
            tracingId: axon.id,
            structureIdentifierId: somaId
        }
    }) : (dendrite != null ? await TracingNode.findOne({
        where: {
            tracingId: dendrite.id,
            structureIdentifierId: somaId
        }
    }) : null);

    // SWC

    let swc = swcHeader(sample, mouse, injectionVirus, fluorophore, neuron, soma, isCcfv3);

    // Promise chain to force serial export of multiple tracings for the neuron.  Required to allow for sample number
    // offsets when appending multiple tracings.
    await tracings.reduce(async (promise: Promise<number>, t: Tracing, index): Promise<number> => {
        const offset = await promise;

        return new Promise<number>(async (resolve) => {
            let nodes = await TracingNode.findAll({
                where: {tracingId: t.id},
                order: [["sampleNumber", "ASC"]]
            });

            // Write the soma from the first tracing associated with the neuron.  Otherwise skip.
            if (index === 0) {
                const node = nodes[0];

                swc += (isCcfv3 ? `${node.sampleNumber}\t${1}\t${node.z.toFixed(6)}\t${node.y.toFixed(6)}\t${node.x.toFixed(6)}\t${node.radius.toFixed(6)}\t${-1}\n` :
                    `${node.sampleNumber}\t${1}\t${node.x.toFixed(6)}\t${node.y.toFixed(6)}\t${node.z.toFixed(6)}\t${node.radius.toFixed(6)}\t${-1}\n`);
            }

            nodes = nodes.slice(1);

            swc += mapToSwc(nodes, pathStructureMap.get(tracingStructureMap.get(t.id)), offset, isCcfv3);

            // offset += nodes.length;

            resolve(offset + nodes.length);
        });
    }, Promise.resolve(0));

    fs.writeFileSync(path.join(outputLocation, swcSubdir, neuron.idString + ".swc"), swc);

    // JSON

    const obj = await mapToJSON(sample, mouse, injectionVirus, fluorophore, neuron, axon, dendrite, soma, isCcfv3);

    if (obj) {
        fs.writeFileSync(path.join(outputLocation, jsonSubdir, neuron.idString + ".json"), JSON.stringify(obj));
    }
}

function swcHeader(sample: Sample, mouse: MouseStrain, virus: InjectionVirus, fluorophore: Fluorophore, neuron: Neuron, soma: TracingNode, isCcfv3: boolean) {
    let header = `# Please consult Terms-of-Use at https://mouselight.janelia.org when referencing this reconstruction.\n`
        + `# DOI:\t\t\t\t\t${neuron.doi || "n/a"}\n`
        + `# Neuron Id:\t\t\t${neuron.idString}\n`
        + `# Sample Date:\t\t\t${sample.sampleDate.toUTCString()}\n`
        + `# Sample Strain:\t\t${mouse?.name ?? "<not specified>"}\n`
        + `# Label Virus:\t\t\t${virus.name}\n`
        + `# Label Fluorophore:\t${fluorophore.name}\n`
        + (isCcfv3 ?
            `# Annotation Space:\t\tCCFv3.0 Axes> X: Anterior-Posterior; Y: Inferior-Superior; Z:Left-Right\n` :
            `# Annotation Space:\t\tCCFv2.5 (ML legacy) Axes> Z: Anterior-Posterior; Y: Inferior-Superior; X:Left-Right\n`);

    if (soma) {
        const somaBrainArea = isCcfv3 ? brainAreaMap.get(soma.brainAreaIdCcfV30) : brainAreaMap.get(soma.brainAreaIdCcfV25);
        header += `# Soma Compartment Id:\t\t   ${somaBrainArea?.structureId} (${somaBrainArea?.name ?? "null"})\n`;
    }

    if (neuron.annotationMetadata) {
        try {
            const annotationObj = JSON.parse(neuron.annotationMetadata);

            if (annotationObj?.manualAnnotations) {
                if (annotationObj.manualAnnotations.curatedCompartmentId) {
                    const compartment = brainAreaStructureIdMap.get(annotationObj.manualAnnotations.curatedCompartmentId);
                    header += `# Curated Soma Compartment Id: ${annotationObj.manualAnnotations.curatedCompartmentId} (${compartment?.name ?? "null"})\n`;
                }

                const legacy = annotationObj.manualAnnotations.legacyCompartmentIds.filter(id => id && id.trim().length > 0);

                if (legacy && legacy.length > 0) {
                    const names = legacy.map(id => brainAreaStructureIdMap.get(id)?.name ?? id);
                    header += `# Legacy Soma Compartment Ids: ${legacy.join(", ")} (${names.join(", ")})\n`;
                }

                if (annotationObj.manualAnnotations.procrustesAxon) {
                    header += `# Procrustes Axon:\t\t\t   ${annotationObj.manualAnnotations.procrustesAxon}\n`;
                }

                if (annotationObj.manualAnnotations.procrustesDend) {
                    header += `# Procrustes Dendrite:\t\t   ${annotationObj.manualAnnotations.procrustesDend}\n`;
                }
            }
        } catch (ex) {
            debug(`failed to parse annotation metadata for ${neuron.idString}`)
        }
    }

    return header;
}

function mapToSwc(nodes: TracingNode[], pathStructure: number, offset: number = 0, flip: boolean): string {
    return nodes.reduce((prev, node) => {
        let sampleNumber = node.sampleNumber;
        let parentNumber = node.parentNumber;

        if (parentNumber !== 1) {
            parentNumber += offset;
        }

        sampleNumber += offset;

        return prev +
            (flip ?
                `${sampleNumber}\t${pathStructure}\t${node.z.toFixed(6)}\t${node.y.toFixed(6)}\t${node.x.toFixed(6)}\t${node.radius.toFixed(6)}\t${parentNumber}\n` :
                `${sampleNumber}\t${pathStructure}\t${node.x.toFixed(6)}\t${node.y.toFixed(6)}\t${node.z.toFixed(6)}\t${node.radius.toFixed(6)}\t${parentNumber}\n`);
    }, "");
}

async function mapToJSON(sample: Sample, mouse: MouseStrain, virus: InjectionVirus, fluorophore: Fluorophore, neuron: Neuron, axon: any, dendrite: any, soma: TracingNode, isCcfv3: boolean): Promise<any> {
    let allenIds = [];

    let somaObj = {};

    if (soma) {
        const somaBrainArea = isCcfv3 ? brainAreaMap.get(soma.brainAreaIdCcfV30) : brainAreaMap.get(soma.brainAreaIdCcfV25);

        somaObj = {
            x: (isCcfv3 ? soma.z : soma.x) || NaN,
            y: soma.y || NaN,
            z: (isCcfv3 ? soma.x : soma.z) || NaN,
            allenId: somaBrainArea ? somaBrainArea.structureId : null
        };
    } else {
        debug(`no soma for json export of ${neuron.idString || neuron.id}`)
    }

    let axonNodes: TracingNode[] = [];

    if (axon) {
        axonNodes = await TracingNode.findAll({
            where: {tracingId: axon.id},
            order: [["sampleNumber", "ASC"]]
        });
    }

    let dendriteNodes: TracingNode[] = [];

    if (dendrite) {
        dendriteNodes = await TracingNode.findAll({
            where: {tracingId: dendrite.id},
            order: [["sampleNumber", "ASC"]]
        });
    }

    const obj = {
        neuron: {
            idString: neuron.idString,
            DOI: neuron.doi || "n/a",
            sample: {
                date: sample.sampleDate,
                strain: mouse?.name ?? "<not specified>"
            },
            label: {
                virus: virus.name,
                fluorophore: fluorophore.name
            },
            annotationSpace: {
                version: isCcfv3 ? 3.0 : 2.5,
                description: isCcfv3 ? "Annotation Space: CCFv3.0 Axes> X: Anterior-Posterior; Y: Inferior-Superior; Z:Left-Right" : "Annotation Space: CCFv2.5 (ML legacy) Axes> Z: Anterior-Posterior; Y: Inferior-Superior; X:Left-Right",
            },
            soma: somaObj
        }
    }

    if (neuron.annotationMetadata) {
        try {
            const annotationObj = JSON.parse(neuron.annotationMetadata);

            if (annotationObj?.manualAnnotations) {
                if (annotationObj.manualAnnotations.curatedCompartmentId) {
                    obj.neuron["curatedSoma"] = {
                        "allenId": annotationObj.manualAnnotations.curatedCompartmentId
                    }
                }

                if (annotationObj.manualAnnotations.legacyCompartmentIds && annotationObj.manualAnnotations.legacyCompartmentIds.length > 0) {
                    obj.neuron["legacySoma"] = {
                        "allenIds": annotationObj.manualAnnotations.legacyCompartmentIds
                    }
                }

                if (annotationObj.manualAnnotations.procrustesAxon) {
                    obj.neuron["procrustesAxon"] = annotationObj.manualAnnotations.procrustesAxon;
                }

                if (annotationObj.manualAnnotations.procrustesDend) {
                    obj.neuron["procrustesDendrite"] = annotationObj.manualAnnotations.procrustesDend;
                }
            }
        } catch (ex) {
            debug(`failed to parse annotation metadata for ${neuron.idString}`)
        }
    }


    obj.neuron["axon"] = axonNodes.map(n => {
        const brainAreaId = isCcfv3 ? n.brainAreaIdCcfV30 : n.brainAreaIdCcfV25;

        if (brainAreaId) allenIds.push(brainAreaId);

        return {
            sampleNumber: n.sampleNumber,
            structureIdentifier: n.parentNumber === -1 ? 1 : 2,
            x: (isCcfv3 ? n.z : n.x),
            y: n.y,
            z: (isCcfv3 ? n.x : n.z),
            radius: n.radius,
            parentNumber: n.parentNumber,
            allenId: brainAreaId ? brainAreaMap.get(brainAreaId).structureId : null
        }
    });

    obj.neuron["dendrite"] = dendriteNodes.map(n => {
        const brainAreaId = isCcfv3 ? n.brainAreaIdCcfV30 : n.brainAreaIdCcfV25;

        if (brainAreaId) allenIds.push(brainAreaId);

        return {
            sampleNumber: n.sampleNumber,
            structureIdentifier: n.parentNumber === -1 ? 1 : 3,
            x: (isCcfv3 ? n.z : n.x),
            y: n.y,
            z: (isCcfv3 ? n.x : n.z),
            radius: n.radius,
            parentNumber: n.parentNumber,
            allenId: brainAreaId ? brainAreaMap.get(brainAreaId).structureId : null
        }
    });

    allenIds = _.uniq(allenIds);

    obj.neuron["allenInformation"] = allenIds.map(a => {
        const b = brainAreaMap.get(a);

        return {
            allenId: b.structureId,
            name: b.name,
            safeName: b.safeName,
            acronym: b.acronym,
            graphOrder: b.graphOrder,
            structureIdPath: b.structureIdPath,
            colorHex: b.geometryColor
        }
    }).sort((a, b) => a.allenId < b.allenId ? -1 : 1);

    return obj;
}
