import * as fs from "fs-extra";
import * as path from "path";
import * as _ from "lodash";

const debug = require("debug")("ndb:data:search:generate-contents");

import {ServiceOptions} from "../options/serviceOptions";
import {PersistentStorageManager} from "../models/persistentStorageManager";

import {IBrainArea} from "../models/sample/brainArea";
import {INeuron} from "../models/sample/neuron";
import {IMouseStrain} from "../models/sample/mouseStrain";
import {ISample} from "../models/sample/sample";
import {IInjectionVirus} from "../models/sample/injectionVirus";
import {IFluorophore} from "../models/sample/fluorophore";
import {ITracing} from "../models/search/tracing";
import {ITracingNode} from "../models/search/tracingNode";
import {TracingStructure} from "../models/search/tracingStructure";

const storageManager = PersistentStorageManager.Instance();

const pathStructureMap = new Map<string, number>();
const brainAreaMap = new Map<string, IBrainArea>();
const neuronTracingMap = new Map<string, ITracing[]>();
const tracingsSomaMap = new Map<string, ITracingNode>();

let axonId = null;
let dendriteId = null;

let outputLocation = ServiceOptions.exportPath;

generateContents(outputLocation).then();

export async function generateContents(outputLocation: string) {
    try {
        await storageManager.whenReady();

        try {
            await fs.ensureDir(path.join(outputLocation, "swc"));
            await fs.ensureDir(path.join(outputLocation, "json"));
        } catch (err) {
            console.log(err);
            return;
        }

        let s = await storageManager.Search.TracingStructure.findOne({where: {value: TracingStructure.axon}});
        pathStructureMap.set(s.id, 2);
        axonId = s.id;
        s = await storageManager.Search.TracingStructure.findOne({where: {value: TracingStructure.dendrite}});
        pathStructureMap.set(s.id, 3);
        dendriteId = s.id;

        const brainAreas = await storageManager.Search.BrainArea.findAll({});

        brainAreas.map(b => brainAreaMap.set(b.id, b.toJSON()));

        const tracingSomaMaps = await storageManager.Search.TracingSomaMap.findAll({});

        await Promise.all(tracingSomaMaps.map(async (tsm) => {
            const soma = await storageManager.Search.TracingNode.findById(tsm.somaId);
            tracingsSomaMap.set(tsm.tracingId, soma ? soma.toJSON() : null);
        }));

        const tracings = await storageManager.Search.Tracing.findAll({});

        tracings.map(t => {
            if (neuronTracingMap.has(t.neuronId)) {
                neuronTracingMap.get(t.neuronId).push(t.toJSON());
            } else {
                neuronTracingMap.set(t.neuronId, [t.toJSON()]);
            }
        });

        const neurons = await storageManager.Search.Neuron.findAll({});

        await Promise.all(neurons.map(n => processNeuron(n, outputLocation)));

    } catch (err) {
        debug(err);
    }
}

async function processNeuron(neuron: INeuron, outputLocation: string) {
    const relNeuron = await storageManager.Neurons.findById(neuron.id);

    const injection = await storageManager.Injections.findById(relNeuron.injectionId);

    const fluorophore = await storageManager.Fluorophores.findById(injection.fluorophoreId);

    const injectionVirus = await storageManager.InjectionViruses.findById(injection.injectionVirusId);

    const sample = await storageManager.Samples.findById(injection.sampleId);

    const mouse = await storageManager.MouseStrains.findById(sample.mouseStrainId);

    // ---

    let swc = swcHeader(sample, mouse, injectionVirus, fluorophore, neuron);

    // let offset = 0;

    const tracings: ITracing[] = neuronTracingMap.get(neuron.id);

    await tracings.reduce(async (promise: Promise<number>, t: ITracing, index): Promise<number> => {
        const offset = await promise;

        return new Promise<number>(async (resolve) => {
            let nodes = await storageManager.Search.TracingNode.findAll({
                where: {tracingId: t.id},
                order: [["sampleNumber", "ASC"]]
            });

            if (index === 0) {
                const node = nodes[0];

                swc += `${node.sampleNumber}\t${1}\t${node.x.toFixed(6)}\t${node.y.toFixed(6)}\t${node.z.toFixed(6)}\t${node.radius.toFixed(6)}\t${-1}\n`;
            }

            nodes = nodes.slice(1);

            swc += mapToSwc(nodes, pathStructureMap.get(t.tracingStructureId), offset);

            // offset += nodes.length;

            resolve(offset + nodes.length);
        });
    }, Promise.resolve(0));

    /*
    await Promise.all(tracings.map(async (t: any, index: number) => {
        let nodes = await storageManager.Search.TracingNode.findAll({
            where: {tracingId: t.id},
            order: [["sampleNumber", "ASC"]]
        });

        if (index === 0) {
            const node = nodes[0];

            swc += `${node.sampleNumber}\t${1}\t${node.x.toFixed(6)}\t${node.y.toFixed(6)}\t${node.z.toFixed(6)}\t${node.radius.toFixed(6)}\t${-1}\n`;
        }

        nodes = nodes.slice(1);

        swc += mapToSwc(nodes, pathStructureMap.get(t.tracingStructureId), offset);

        offset += nodes.length;
    }));*/

    fs.writeFileSync(path.join(outputLocation, "swc", neuron.idString + ".swc"), swc);

    // ---
    let axon: any = tracings.filter((t: any) => t.tracingStructureId === axonId);
    axon = axon.length > 0 ? axon[0] : null;

    let dendrite: any = tracings.filter((t: any) => t.tracingStructureId === dendriteId);
    dendrite = dendrite.length > 0 ? dendrite[0] : null;

    let soma = tracingsSomaMap.get(axon.id);

    if (soma === null) {
        soma = tracingsSomaMap.get(dendrite.id);
    }

    const obj = await mapToJSON(sample, mouse, injectionVirus, fluorophore, neuron, axon, dendrite, soma);

    if (obj) {
        fs.writeFileSync(path.join(outputLocation, "json", neuron.idString + ".json"), JSON.stringify(obj));
    }
}

function swcHeader(sample: ISample, mouse: IMouseStrain, virus: IInjectionVirus, fluorophore: IFluorophore, neuron: INeuron) {
    return `# Please consult Terms-of-Use at https://mouselight.janelia.org when referencing this reconstruction.\n`
        + `# DOI:\t\t\t\t\t${neuron.doi || "n/a"}\n`
        + `# Neuron Id:\t\t\t${neuron.idString}\n`
        + `# Sample Date:\t\t\t${sample.sampleDate.toUTCString()}\n`
        + `# Sample Strain:\t\t${mouse.name}\n`
        + `# Label Virus:\t\t\t${virus.name}\n`
        + `# Label Fluorophore:\t${fluorophore.name}\n`
}

function mapToSwc(nodes: ITracingNode[], pathStructure: number, offset: number = 0): string {
    return nodes.reduce((prev, node) => {
        let sampleNumber = node.sampleNumber;
        let parentNumber = node.parentNumber;

        if (parentNumber !== 1) {
            parentNumber += offset;
        }

        sampleNumber += offset;

        return prev + `${sampleNumber}\t${pathStructure}\t${node.x.toFixed(6)}\t${node.y.toFixed(6)}\t${node.z.toFixed(6)}\t${node.radius.toFixed(6)}\t${parentNumber}\n`;
    }, "");
}

async function mapToJSON(sample: ISample, mouse: IMouseStrain, virus: IInjectionVirus, fluorophore: IFluorophore, neuron: INeuron, axon: any, dendrite: any, soma: ITracingNode): Promise<any> {
    let allenIds = [];

    let somaObj = {};

    if (soma) {
        somaObj = {
            x: soma.x || NaN,
            y: soma.y || NaN,
            z: soma.z || NaN,
            allenId: brainAreaMap.get(soma.brainAreaId).structureId
        };
    }

    let axonNodes = [];

    if (axon) {
        axonNodes = await storageManager.Search.TracingNode.findAll({
            where: {tracingId: axon.id},
            order: [["sampleNumber", "ASC"]]
        });
    }

    let dendriteNodes = [];

    if (dendrite) {
        dendriteNodes = await storageManager.Search.TracingNode.findAll({
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
                strain: mouse.name
            },
            label: {
                virus: virus.name,
                fluorophore: fluorophore.name
            },
            soma: somaObj,
            axon: axonNodes.map(n => {
                if (n.brainAreaId) allenIds.push(n.brainAreaId);
                return {
                    sampleNumber: n.sampleNumber,
                    structureIdentifier: n.parentNumber === -1 ? 1 : 2,
                    x: n.x,
                    y: n.y,
                    z: n.z,
                    radius: n.radius,
                    parentNumber: n.parentNumber,
                    allenId: n.brainAreaId ? brainAreaMap.get(n.brainAreaId).structureId : null
                }
            }),
            dendrite: dendriteNodes.map(n => {
                if (n.brainAreaId) allenIds.push(n.brainAreaId);
                return {
                    sampleNumber: n.sampleNumber,
                    structureIdentifier: n.parentNumber === -1 ? 1 : 3,
                    x: n.x,
                    y: n.y,
                    z: n.z,
                    radius: n.radius,
                    parentNumber: n.parentNumber,
                    allenId: n.brainAreaId ? brainAreaMap.get(n.brainAreaId).structureId : null
                }
            })
        }
    };

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
