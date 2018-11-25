import * as fs from "fs-extra";
import * as path from "path";
import * as _ from "lodash";

const debug = require("debug")("ndb:data:search:generate-contents");

import {ServiceOptions} from "../options/serviceOptions";
import {PersistentStorageManager} from "../models/persistentStorageManager";

import {IMouseStrain} from "../models/sample/mouseStrain";
import {ISample} from "../models/sample/sample";
import {IInjectionVirus} from "../models/sample/injectionVirus";
import {IFluorophore} from "../models/sample/fluorophore";
import {SearchTracingStructureId} from "../models/search/tracingStructure";
import {ISearchBrainArea} from "../models/search/brainArea";
import {ISearchTracingNode} from "../models/search/tracingNode";
import {ISearchTracing, ISearchTracingAttributes} from "../models/search/tracing";
import {ISearchNeuron} from "../models/search/neuron";

const storageManager = PersistentStorageManager.Instance();

const pathStructureMap = new Map<string, number>();
const brainAreaMap = new Map<string, ISearchBrainArea>();
const neuronTracingMap = new Map<string, ISearchTracing[]>();

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

        let s = await storageManager.Search.TracingStructure.findOne({where: {value: SearchTracingStructureId.axon}});
        pathStructureMap.set(s.id, 2);
        axonId = s.id;
        s = await storageManager.Search.TracingStructure.findOne({where: {value: SearchTracingStructureId.dendrite}});
        pathStructureMap.set(s.id, 3);
        dendriteId = s.id;

        const brainAreas: ISearchBrainArea[] = await storageManager.Search.BrainArea.findAll({});

        brainAreas.map(b => brainAreaMap.set(b.id, b));

        const tracings = await storageManager.Search.Tracing.findAll({
            include: [{
                model: storageManager.Search.TracingNode,
                as: "soma"
            }]
        });

        tracings.map(t => {
            if (neuronTracingMap.has(t.neuronId)) {
                neuronTracingMap.get(t.neuronId).push(t);
            } else {
                neuronTracingMap.set(t.neuronId, [t]);
            }
        });

        const neurons = await storageManager.Search.Neuron.findAll({});

        await Promise.all(neurons.map(n => processNeuron(n, outputLocation)));

    } catch (err) {
        debug(err);
    }
}

async function processNeuron(neuron: ISearchNeuron, outputLocation: string) {
    const relNeuron = await storageManager.Sample.Neuron.findById(neuron.id);

    const injection = await storageManager.Sample.Injection.findById(relNeuron.injectionId);

    const fluorophore = await storageManager.Sample.Fluorophore.findById(injection.fluorophoreId);

    const injectionVirus = await storageManager.Sample.InjectionVirus.findById(injection.injectionVirusId);

    const sample = await storageManager.Sample.Sample.findById(injection.sampleId);

    const mouse = await storageManager.Sample.MouseStrain.findById(sample.mouseStrainId);

    // ---

    let swc = swcHeader(sample, mouse, injectionVirus, fluorophore, neuron);

    const tracings: ISearchTracing[] = neuronTracingMap.get(neuron.id);

    // Promise chain to force serial export of multiple tracings for the neuron.  Required to allow for sample number
    // offsets when appending multiple tracings.
    await tracings.reduce(async (promise: Promise<number>, t: ISearchTracingAttributes, index): Promise<number> => {
        const offset = await promise;

        return new Promise<number>(async (resolve) => {
            let nodes = await storageManager.Search.TracingNode.findAll({
                where: {tracingId: t.id},
                order: [["sampleNumber", "ASC"]]
            });

            // Write the soma from the first tracing associated with the neuron.  Otherwise skip.
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

    fs.writeFileSync(path.join(outputLocation, "swc", neuron.idString + ".swc"), swc);

    // ---

    const axons: ISearchTracing[] = tracings.filter((t: any) => t.tracingStructureId === axonId);
    const axon = axons.length > 0 ? axons[0] : {soma: null};

    const dendrites: ISearchTracing[] = tracings.filter((t: any) => t.tracingStructureId === dendriteId);
    const dendrite = dendrites.length > 0 ? dendrites[0] : {soma: null};

    let soma = axon.soma || dendrite.soma;

    const obj = await mapToJSON(sample, mouse, injectionVirus, fluorophore, neuron, axon, dendrite, soma);

    if (obj) {
        fs.writeFileSync(path.join(outputLocation, "json", neuron.idString + ".json"), JSON.stringify(obj));
    }
}

function swcHeader(sample: ISample, mouse: IMouseStrain, virus: IInjectionVirus, fluorophore: IFluorophore, neuron: ISearchNeuron) {
    return `# Please consult Terms-of-Use at https://mouselight.janelia.org when referencing this reconstruction.\n`
        + `# DOI:\t\t\t\t\t${neuron.doi || "n/a"}\n`
        + `# Neuron Id:\t\t\t${neuron.idString}\n`
        + `# Sample Date:\t\t\t${sample.sampleDate.toUTCString()}\n`
        + `# Sample Strain:\t\t${mouse.name}\n`
        + `# Label Virus:\t\t\t${virus.name}\n`
        + `# Label Fluorophore:\t${fluorophore.name}\n`
}

function mapToSwc(nodes: ISearchTracingNode[], pathStructure: number, offset: number = 0): string {
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

async function mapToJSON(sample: ISample, mouse: IMouseStrain, virus: IInjectionVirus, fluorophore: IFluorophore, neuron: ISearchNeuron, axon: any, dendrite: any, soma: ISearchTracingNode): Promise<any> {
    let allenIds = [];

    let somaObj = {};

    if (soma) {
        somaObj = {
            x: soma.x || NaN,
            y: soma.y || NaN,
            z: soma.z || NaN,
            allenId: brainAreaMap.get(soma.brainAreaId).structureId
        };
    } else {
        debug(`no soma for json export of ${neuron.idString || neuron.id}`)
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
