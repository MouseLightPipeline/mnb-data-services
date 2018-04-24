import {StructureIdentifiers} from "./models/swc/structureIdentifier";

const debug = require("debug")("ndb:data:search:generate-contents");
import * as _ from "lodash";

import {PersistentStorageManager} from "./models/databaseConnector";

const storageManager = PersistentStorageManager.Instance();

const neuronMap = new Map<string, any>();

const tracingsMap = new Map<string, any>();

export async function generateContents() {

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
    const current = await simpleSync(storageManager.Neurons, storageManager.Search.Neuron, "neurons");

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

    const neurons = await storageManager.Search.Neuron.findAll({});

    neurons.map(n => {
        neuronMap.set(n.id, n);
    });
}

async function syncTracings() {
    const inTracings = await storageManager.Tracings.findAll({});

    const outTracings = await storageManager.Search.Tracing.findAll({});

    debug(`Upsert ${inTracings.length} tracings`);
    await Promise.all(inTracings.map(async (t) => {
        const obj = t.toJSON();

        const swcTracing = await storageManager.SwcTracings.findById(t.swcTracingId);
        const neuron = await storageManager.Neurons.findById(swcTracing.neuronId);
        obj.neuronId = neuron.id;
        obj.tracingStructureId = swcTracing.tracingStructureId;

        await storageManager.Search.Tracing.upsert(obj);
    }));

    await storageManager.Search.TracingSomaMap.destroy({where: {}});

    await storageManager.Search.TracingNode.destroy({where: {}});

    const toRemove = _.differenceBy(outTracings, inTracings, "id");

    if (toRemove.length > 0) {
        debug(`Remove ${toRemove.length} stale tracings`);
        await storageManager.Search.Tracing.destroy({where: {id: {$in: toRemove.map(r => r.id)}}});
    }

    const tracings = await storageManager.Search.Tracing.findAll({});

    tracings.map(t => {
        tracingsMap.set(t.id, t);
    });
}

async function syncNodes() {
    const increment = 10000;

    const count = await storageManager.Nodes.count();

    let offset = 0;

    while (offset < count) {
        const nodes = await storageManager.Nodes.findAll({order: [["id", "ASC"]], offset, limit: increment});

        await storageManager.Search.TracingNode.bulkCreate(nodes.map(n => n.toJSON()));

        debug(offset + nodes.length);

        offset += increment;
    }
}

async function syncTracingSomaMap() {
    const somaStructureIdentifier = await storageManager.Search.StructureIdentifier.findOne({where: {value: StructureIdentifiers.soma}});

    const tracings = await storageManager.Search.Tracing.findAll({});

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
    const input = await storageManager.BrainCompartment.findAll({});

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

    const output = await storageManager.Search.NeuronBrainAreaMap.findAll({});

    const toRemove = _.differenceBy(output, input, "id");

    if (toRemove.length > 0) {
        debug(`Remove ${toRemove.length} neuron brain area maps`);
        await  storageManager.Search.NeuronBrainAreaMap.destroy({where: {id: {$in: toRemove.map(r => r.id)}}});
    }
}

async function simpleSync(srcModel, dstModel, name) {
    const input = await srcModel.findAll({});

    const output = await dstModel.findAll({});

    debug(`Upsert ${input.length} ${name}`);
    const current = await Promise.all(input.map(async (b) => {
        const pojo = b.toJSON();

        await dstModel.upsert(pojo);

        return pojo;
    }));

    const toRemove = _.differenceBy(output, input, "id");

    if (toRemove.length > 0) {
        debug(`Remove ${input.length} stale ${name}`);
        await dstModel.destroy({where: {id: {$in: toRemove.map(r => r.id)}}});
    }

    return current;
}

async function getBrainArea(id: string) {
    if (id) {
        return storageManager.Search.BrainArea.findById(id);
    } else {
        return null;
    }
}
