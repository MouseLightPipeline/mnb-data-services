import {StructureIdentifiers} from "./models/swc/structureIdentifier";

const debug = require("debug")("ndb:data:search:generate-contents");
import * as _ from "lodash";

import {PersistentStorageManager} from "./models/databaseConnector";
import {INeuron} from "ndb-data-models";
import {ITracing} from "./models/transform/tracing";

enum ShareVisibility {
    DoNotShare = 0,
    Inherited = 0x01,
    ShareAllInternal = 0x02,
    ShareAllExternal = 0x04
}

const NODE_INSERT_INCREMEMNT = 25000;

const storageManager = PersistentStorageManager.Instance();

const neuronMap = new Map<string, any>();

const tracingsMap = new Map<string, any>();

let neuronRemoveIds: string[] = [];
let tracingRemoveIds: string[] = [];

let minVisibilityLevel = ShareVisibility.ShareAllExternal;

export async function generateContents(visibility: string = "") {

    switch (visibility.toLowerCase()) {
        case "public":
            minVisibilityLevel = ShareVisibility.ShareAllExternal;
            break;
        case "internal":
            minVisibilityLevel = ShareVisibility.ShareAllInternal;
            break;
        case "all":
            minVisibilityLevel = ShareVisibility.DoNotShare;
            break;
    }
    debug(`updating using minimum visibility of ${minVisibilityLevel}`);

    try {
        await storageManager.whenReady();

        await syncBrainAreas();

        await syncStructureIdentifiers();

        await syncTracingStructures();

        await syncNeurons();

        await syncTracings();

        await syncNodes();

        await syncTracingSomaMap();

        await syncNeuronBrainCompartmentMaps();

        await removeBrainAreaMaps();

        await removeTracings();

        await removeNeurons();
    } catch (err) {
        debug(err);
    }
}

async function syncBrainAreas() {
    await simpleSync(storageManager.BrainAreas, storageManager.Search.BrainArea, "brain areas");
}

async function syncStructureIdentifiers() {
    await simpleSync(storageManager.StructureIdentifiers, storageManager.Search.StructureIdentifier, "structure identifiers");
}

async function syncTracingStructures() {
    await simpleSync(storageManager.TracingStructures, storageManager.Search.TracingStructure, "tracing structures");
}

async function syncNeurons() {
    const samples = await storageManager.Samples.findAll({
        where: {
            sharing: {
                $gte: minVisibilityLevel
            }
        }
    });

    const injections = await storageManager.Injections.findAll({
        where: {
            sampleId: {
                $in: samples.map(s => s.id)
            }
        }
    });

    const input = await storageManager.Neurons.findAll({
        where: {
            $and: [{
                injectionId: {
                    $in: injections.map(s => s.id)
                },
                $or: [
                    {
                        sharing: {
                            $gte: minVisibilityLevel
                        }
                    },
                    {sharing: ShareVisibility.Inherited}
                ]
            }]
        }
    });

    const output: INeuron[] = await storageManager.Search.Neuron.findAll({});

    debug(`upsert ${input.length} neurons`);

    const current = await Promise.all(input.map(async (b) => {
        const pojo = b.toJSON();

        await storageManager.Search.Neuron.upsert(pojo);

        return pojo;
    }));

    await Promise.all(current.map(async (n: any) => {
        let brainArea = null;

        if (!n.brainAreaId) {
            const i = await storageManager.Injections.findById(n.injectionId);

            brainArea = await getBrainArea(i.brainAreaId);

            n.brainAreaId = brainArea.toJSON().id;
        }
    }));

    await Promise.all(current.map(async (n: any) => {
        await storageManager.Search.Neuron.upsert(n);
    }));

    input.map(n => {
        neuronMap.set(n.id, n);
    });

    neuronRemoveIds = _.differenceBy(output, input, "id").map(r => r.id);

    debug(`${neuronRemoveIds.length} neuron(s) pending removal`);
}

async function syncTracings() {
    // Tracings are once removed from neurons via the swc tracing.  Load all tracings, map to the swc tracing, and then
    // only use those tracings that map back to included neurons
    const inTracings = await storageManager.Tracings.findAll({
        where: {}
    });

    debug(`evaluating ${inTracings.length} tracings`);

    const existingTracings: ITracing[] = await storageManager.Search.Tracing.findAll({});

    await Promise.all(inTracings.map(async (t) => {
        const obj = t.toJSON();

        const swcTracing = await storageManager.SwcTracings.findById(t.swcTracingId);

        if (neuronMap.has(swcTracing.neuronId)) {
            obj.neuronId = swcTracing.neuronId;
            obj.tracingStructureId = swcTracing.tracingStructureId;

            await storageManager.Search.Tracing.upsert(obj);

            tracingsMap.set(obj.id, obj);
        }
    }));

    debug(`identified ${tracingsMap.size} tracings from ${neuronMap.size} neurons`);

    // Rather than sync removals later, drop all the rows and regenerate in next steps.
    await storageManager.Search.TracingSomaMap.destroy({where: {}});
    await storageManager.Search.TracingNode.destroy({where: {}});

    tracingRemoveIds = _.differenceBy(existingTracings, Array.from(tracingsMap.values()), "id").map(r => r.id);

    debug(`${tracingRemoveIds.length} tracing(s) pending removal`);
}

async function syncNodes() {
    const tracingIds = Array.from(tracingsMap.keys());

    const count = await storageManager.Nodes.count({where: {tracingId: {$in: tracingIds}}});

    let offset = 0;

    debug(`Syncing ${count} nodes`);

    while (offset < count) {
        const nodes = await storageManager.Nodes.findAll({
            order: [["id", "ASC"]],
            offset,
            limit: NODE_INSERT_INCREMEMNT,
            where: {tracingId: {$in: tracingIds}}
        });

        await storageManager.Search.TracingNode.bulkCreate(nodes.map(n => n.toJSON()));

        debug(offset + nodes.length);

        offset += NODE_INSERT_INCREMEMNT;
    }
}

async function syncTracingSomaMap() {
    const somaStructureIdentifier = await storageManager.Search.StructureIdentifier.findOne({where: {value: StructureIdentifiers.soma}});

    const tracings = await storageManager.Search.Tracing.findAll({});

    debug(`Upsert ${tracings.length} tracing-soma maps`);

    await Promise.all(tracings.map(async (t) => {
        const soma = await storageManager.Nodes.findOne({
            where: {
                tracingId: t.id,
                structureIdentifierId: somaStructureIdentifier.id
            }
        });

        if (soma) {
            storageManager.Search.TracingSomaMap.create({
                tracingId: t.id,
                somaId: soma.id,
            });
        } else {
            debug(`No soma for tracing ${t.id}`);
        }
    }));
}

async function syncNeuronBrainCompartmentMaps() {
    const input = await storageManager.BrainCompartment.findAll({where: {tracingId: {$in: Array.from(tracingsMap.keys())}}});

    debug(`Upsert ${input.length} neuron brain area maps`);

    await Promise.all(input.map(async (c) => {
        const obj = c.toJSON();

        const tracing = tracingsMap.get(c.tracingId);

        const neuron = neuronMap.get(tracing.neuronId);

        if (neuron) {
            obj.neuronId = neuron.id;
        } else {
            debug(`No neuron for tracing ${tracing.id} referencing ${tracing.neuronId}`);
        }

        const map = await storageManager.Search.TracingSomaMap.findOne({where: {tracingId: tracing.id}});

        if (map) {
            const node = await storageManager.Search.TracingNode.findById(map.somaId);

            obj.somaX = node.x;
            obj.somaY = node.y;
            obj.somaZ = node.z;
        } else {

            obj.somaX = neuron.x;
            obj.somaY = neuron.y;
            obj.somaZ = neuron.z;
        }

        obj.tracingStructureId = tracing.tracingStructureId;

        obj.neuronIdString = neuron.idString;
        obj.neuronDOI = neuron.doi;

        // Fix for how registered data was created.  Want it to match manually entered neuron information, not soma from
        // tracing.
        // obj.somaCount = 0;

        await storageManager.Search.NeuronBrainAreaMap.upsert(obj);
    }));

    //  const output: IModelWithId[] = await storageManager.Search.NeuronBrainAreaMap.findAll({});

    //  const toRemove = _.differenceBy(output, input, "id");

    // if (toRemove.length > 0) {
    //     debug(`Remove ${toRemove.length} neuron brain area maps`);
    //    await storageManager.Search.NeuronBrainAreaMap.destroy({where: {id: {$in: toRemove.map(r => r.id)}}});
    // }
}

async function simpleSync(srcModel, dstModel, name: string) {
    const input = await srcModel.findAll({});

    debug(`Upsert ${input.length} ${name}`);

    await Promise.all(input.map(async (b) => {
        await dstModel.upsert(b.toJSON());
    }));
}

async function removeBrainAreaMaps() {
    if (tracingRemoveIds.length === 0 && neuronRemoveIds.length === 0) {
        return;
    }

    await storageManager.Search.NeuronBrainAreaMap.destroy({
        where: {
            $or: [
                {
                    tracingId: {
                        $in: tracingRemoveIds
                    }
                }, {
                    neuronId: {
                        $in: neuronRemoveIds
                    }
                }
            ]
        }
    });
}

async function removeTracings() {
    if (tracingRemoveIds.length === 0) {
        return;
    }

    await storageManager.Search.Tracing.destroy({
        where: {
            id: {
                $in: tracingRemoveIds
            }
        }
    });
}

async function removeNeurons() {
    if (neuronRemoveIds.length === 0) {
        return;
    }

    await storageManager.Search.Neuron.destroy({
        where: {
            id: {
                $in: neuronRemoveIds
            }
        }
    });
}

async function getBrainArea(id: string) {
    if (id) {
        return storageManager.Search.BrainArea.findById(id);
    } else {
        return null;
    }
}
