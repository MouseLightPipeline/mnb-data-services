import * as _ from "lodash";
import * as Sequelize from "sequelize";
import {PersistentStorageManager} from "../models/persistentStorageManager";
import {StructureIdentifiers} from "../models/swc/structureIdentifier";
import {INeuron} from "../models/sample/neuron";
import {ISearchNeuron, ISearchNeuronAttributes, SearchScope} from "../models/search/neuron";
import {ISearchBrainArea} from "../models/search/brainArea";
import {ISearchTracing, ISearchTracingAttributes} from "../models/search/tracing";
import {ISwcTracing} from "../models/swc/tracing";
import {ISearchTracingNode} from "../models/search/tracingNode";
import {ISearchContentAttributes} from "../models/search/searchContent";

const debug = require("debug")("mnb:data:search:generate-contents");

enum ShareVisibility {
    DoNotShare = 0,
    Inherited = 0x01,
    ShareAllInternal = 0x02,
    ShareAllExternal = 0x04
}

const Op = Sequelize.Op;

const NODE_INSERT_INCREMENT = 25000;

const storageManager = PersistentStorageManager.Instance();

const neuronMap = new Map<string, ISearchNeuron>();

const tracingsMap = new Map<string, ISearchTracing>();

const updateRequiredForTracings: string[] = [];

const tracingsSomaMap = new Map<string, ISearchTracingNode>();

let neuronRemoveIds: string[] = [];
let tracingRemoveIds: string[] = [];

generateContents().then((success: boolean) => {
    debug(`translation complete ${success ? "successfully" : "with error"}`);

    process.exit(0);
});

function generateContents(): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
        try {
            await storageManager.whenReady();

            await syncBrainAreas();

            await syncStructureIdentifiers();

            await syncTracingStructures();

            await syncNeurons();

            await syncTracings();

            await syncNodes();

            await syncTracingSomaMap();

            await syncSearchContent();

            await removeSearchContent();

            await removeTracings();

            await removeNeurons();
        } catch (err) {
            debug(err);
            resolve(false);
        }

        resolve(true);
    });
}

async function syncBrainAreas() {
    await simpleSync(storageManager.Sample.BrainArea, storageManager.Search.BrainArea, "brain areas");
}

async function syncStructureIdentifiers() {
    await simpleSync(storageManager.Swc.StructureIdentifier, storageManager.Search.StructureIdentifier, "structure identifiers");
}

async function syncTracingStructures() {
    await simpleSync(storageManager.Swc.TracingStructure, storageManager.Search.TracingStructure, "tracing structures");
}

async function syncNeurons() {
    const input: INeuron[] = await storageManager.Sample.Neuron.findAll({
        include: [{
            model: storageManager.Sample.Injection,
            as: "injection",
            include: [{
                model: storageManager.Sample.Sample,
                as: "sample",
            }]
        }]
    });

    debug(`upsert ${input.length} neurons`);

    const output: ISearchNeuron[] = await storageManager.Search.Neuron.findAll({});

    // All known neurons in search database to we can look up existing.  The global neuronMap should only be neurons
    // will be part of the updated database to drive downstream entity behaviors.
    const localNeuronMap = new Map<string, ISearchNeuron>();

    output.map(n => localNeuronMap.set(n.id, n));

    let skipped = 0;

    await Promise.all(input.map(async (n) => {
        const neuron = localNeuronMap.get(n.id);

        if (!neuron || n.updatedAt > neuron.updatedAt || n.injection.sample.updatedAt > neuron.updatedAt) {
            const searchNeuron: ISearchNeuronAttributes = Object.assign(n.toJSON(), {searchScope: SearchScope.Team});

            if (!n.brainAreaId) {
                const i = await storageManager.Sample.Injection.findById(n.injectionId);

                const brainArea = await getBrainArea(i.brainAreaId);

                searchNeuron.brainAreaId = brainArea.id;
            }

            const visibility = n.sharing === ShareVisibility.Inherited ? n.injection.sample.sharing : n.sharing;

            switch (visibility) {
                case ShareVisibility.ShareAllExternal:
                    searchNeuron.searchScope = SearchScope.Public;
                    break;
                case ShareVisibility.ShareAllInternal:
                    searchNeuron.searchScope = SearchScope.Internal;
                    break;
                case ShareVisibility.DoNotShare:
                    searchNeuron.searchScope = SearchScope.Team;
                    break;
                default:
                    debug(`could not determine visibility of ${n.idString} - defaulting to private`);
                    searchNeuron.searchScope = SearchScope.Private;
            }

            const [model] = await storageManager.Search.Neuron.upsert(searchNeuron, {returning: true});

            neuronMap.set(model.id, model);
        } else {
            neuronMap.set(neuron.id, neuron);
            skipped++;
        }
    }));

    if (skipped > 0) {
        debug(`${skipped} neurons did not change and were skipped`);
    }

    neuronRemoveIds = _.differenceBy(output, input, "id").map(r => r.id);

    if (neuronRemoveIds.length > 0) {
        debug(`${neuronRemoveIds.length} neuron(s) pending removal`);
    }
}

async function syncTracings() {
    // Tracings are once removed from neurons via the swc tracing.
    const swcTracings = await storageManager.Swc.SwcTracing.findAll({
        where: {neuronId: {[Op.in]: Array.from(neuronMap.keys())}}
    });

    debug(`neurons map to ${swcTracings.length} swc tracings`);

    const swcTracingMap = new Map<string, ISwcTracing>();

    swcTracings.map(s => swcTracingMap.set(s.id, s));

    const inTracings = await storageManager.Transform.Tracing.findAll({
        where: {swcTracingId: {[Op.in]: Array.from(swcTracingMap.keys())}}
    });

    debug(`evaluating ${inTracings.length} registered tracings from swc tracings`);

    const existingTracings: ISearchTracing[] = await storageManager.Search.Tracing.findAll({
        where: {neuronId: {[Op.in]: Array.from(neuronMap.keys())}}
    });

    debug(`${existingTracings.length} search db tracings already exist and may require an update`);

    existingTracings.map(t => tracingsMap.set(t.id, t));

    let skipped = 0;
    let missingNeuron = 0;

    await Promise.all(inTracings.map(async (t) => {
        const tracing = tracingsMap.get(t.id);

        const swcTracing = await storageManager.Swc.SwcTracing.findById(t.swcTracingId);

        // None of the neuron properties directly affect search tracing properties, so even if the neuron is being
        // updated, we do not need to update the tracing if its source tracing or swc tracing have not changed.
        if (!tracing || t.updatedAt > tracing.updatedAt || swcTracing.updatedAt > tracing.updatedAt) {
            const searchTracing: ISearchTracingAttributes = Object.assign(t.toJSON());

            searchTracing.neuronId = swcTracing.neuronId;
            searchTracing.tracingStructureId = swcTracing.tracingStructureId;

            const [model] = await storageManager.Search.Tracing.upsert(searchTracing, {returning: true});

            tracingsMap.set(model.id, model);

            updateRequiredForTracings.push(model.id);

            await storageManager.Search.SearchContent.destroy({where: {tracingId: model.id}});
            await storageManager.Search.TracingNode.destroy({where: {tracingId: model.id}});
        } else {
            skipped++;
        }
    }));

    debug(`added or updated ${tracingsMap.size - skipped - missingNeuron} tracings from ${neuronMap.size} neurons`);

    if (skipped > 0) {
        debug(`${skipped} tracings did not change and were skipped`);
    }

    const allSearchTracings: ISearchTracing[] = await storageManager.Search.Tracing.findAll({
        attributes: ["id"]
    });

    tracingRemoveIds = _.differenceBy(allSearchTracings, inTracings, "id").map(r => r.id);

    if (tracingRemoveIds.length > 0) {
        debug(`${tracingRemoveIds.length} tracing(s) pending removal`);
    }
}

async function syncNodes() {
    if (updateRequiredForTracings.length === 0) {
        debug(`no tracings require node updates`);
        return;
    }

    const count = await storageManager.Transform.TracingNode.count({where: {tracingId: {[Op.in]: updateRequiredForTracings}}});

    let offset = 0;

    debug(`Syncing ${count} nodes`);

    while (offset < count) {
        const nodes = await storageManager.Transform.TracingNode.findAll({
            order: [["id", "ASC"]],
            offset,
            limit: NODE_INSERT_INCREMENT,
            where: {tracingId: {[Op.in]: updateRequiredForTracings}}
        });

        await storageManager.Search.TracingNode.bulkCreate(nodes.map(n => n.toJSON()));

        debug(`${offset + nodes.length} inserted`);

        offset += NODE_INSERT_INCREMENT;
    }
}

async function syncTracingSomaMap() {
    if (updateRequiredForTracings.length === 0) {
        debug(`no tracings require soma updates`);
        return;
    }

    const tracings = await storageManager.Search.Tracing.findAll({where: {id: {[Op.in]: updateRequiredForTracings}}});

    debug(`Upsert ${tracings.length} tracing soma`);

    const somaStructureIdentifier = await storageManager.Search.StructureIdentifier.findOne({where: {value: StructureIdentifiers.soma}});

    await Promise.all(tracings.map(async (t) => {
        const soma = await storageManager.Transform.TracingNode.findOne({
            where: {
                tracingId: t.id,
                structureIdentifierId: somaStructureIdentifier.id
            }
        });

        if (soma) {
            tracingsSomaMap.set(t.id, soma);

            await t.update({somaId: soma.id});

            tracingsSomaMap.set(t.id, soma);
        } else {
            debug(`No soma for tracing ${t.id}`);
        }
    }));
}

async function syncSearchContent() {
    if (updateRequiredForTracings.length === 0) {
        debug(`no search content updates are required`);
        return;
    }

    const input = await storageManager.Transform.BrainCompartmentContents.findAll({where: {tracingId: {[Op.in]: updateRequiredForTracings}}});

    debug(`verify ${input.length} search contents`);

    const objs = input.map(c => {
        const obj: ISearchContentAttributes = c.toJSON();

        const tracing = tracingsMap.get(c.tracingId);

        const neuron = neuronMap.get(tracing.neuronId);

        if (neuron) {
            obj.neuronId = neuron.id;
        } else {
            debug(`no neuron for tracing ${tracing.id} referencing ${tracing.neuronId}`);
            return null;
        }

        const node: ISearchTracingNode | ISearchNeuron = tracingsSomaMap.get(tracing.id) || neuron;

        obj.somaX = node.x;
        obj.somaY = node.y;
        obj.somaZ = node.z;

        obj.tracingStructureId = tracing.tracingStructureId;

        obj.neuronIdString = neuron.idString;
        obj.neuronDOI = neuron.doi;

        obj.searchScope = neuron.searchScope;

        return obj;
    }).filter(s => s !== null);

    debug(`bulk create ${input.length} search contents`);

    while (objs.length > 0) {
        const batch = objs.splice(0, 1000);
        await storageManager.Search.SearchContent.bulkCreate(batch);
        debug(`${objs.length} search content remain`);
    }

    debug(`search content complete`);
}

async function simpleSync(srcModel, dstModel, name: string) {
    const input = await srcModel.findAll({});

    debug(`Upsert ${input.length} ${name}`);

    await Promise.all(input.map(async (b) => {
        await dstModel.upsert(b.toJSON());
    }));
}

async function removeSearchContent() {
    if (tracingRemoveIds.length === 0 && neuronRemoveIds.length === 0) {
        return;
    }

    const where = {
        [Op.or]: [
            {
                tracingId: {
                    [Op.in]: tracingRemoveIds
                }
            }, {
                neuronId: {
                    [Op.in]: neuronRemoveIds
                }
            }
        ]
    };

    const count = await storageManager.Search.SearchContent.count({where});

    if (count > 0) {
        debug(`${count} search content are obsolete and will be removed`);
        await storageManager.Search.SearchContent.destroy({where});
    }
}

async function removeTracings() {
    if (tracingRemoveIds.length === 0) {
        return;
    }

    debug(`${tracingRemoveIds.length} tracings are obsolete and will be removed`);

    // Unlink circular dependency to remove entities.
    await storageManager.Search.Tracing.update({somaId: null}, {where: {somaId: {[Op.ne]: null}}});

    await storageManager.Search.TracingNode.destroy({where: {tracingId: {[Op.in]: tracingRemoveIds}}});
    await storageManager.Search.Tracing.destroy({where: {id: {[Op.in]: tracingRemoveIds}}});
}

async function removeNeurons() {
    if (neuronRemoveIds.length === 0) {
        return;
    }

    debug(`${neuronRemoveIds.length} neurons are obsolete and will be removed`);

    await storageManager.Search.Neuron.destroy({
        where: {
            id: {
                [Op.in]: neuronRemoveIds
            }
        }
    });
}

async function getBrainArea(id: string): Promise<ISearchBrainArea> {
    if (id) {
        return storageManager.Search.BrainArea.findById(id);
    } else {
        return null;
    }
}
