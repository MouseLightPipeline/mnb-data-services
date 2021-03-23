import * as _ from "lodash";
import * as Sequelize from "sequelize";

import {StructureIdentifier, StructureIdentifiers} from "../models/swc/structureIdentifier";
import {Neuron} from "../models/sample/neuron";
import {SearchNeuron, SearchNeuronAttributes, SearchScope} from "../models/search/neuron";
import {SearchTracing, SearchTracingAttributes} from "../models/search/tracing";
import {SwcTracing} from "../models/swc/swcTracing";
import {SearchTracingNode, SearchTracingNodeAttributes} from "../models/search/tracingNode";
import uuid = require("uuid");
import {Sample} from "../models/sample/sample";
import {SearchSample, SearchSampleAttributes} from "../models/search/sample";
import {SearchContent, SearchContentAttributes} from "../models/search/searchContent";
import {SearchStructureIdentifier} from "../models/search/structureIdentifier";
import {RemoteDatabaseClient} from "../models/remoteDatabaseClient";
import {DatabaseOptions} from "../options/databaseOptions";
import {BrainArea} from "../models/sample/brainArea";
import {SearchBrainArea} from "../models/search/brainArea";
import {TracingNode} from "../models/transform/tracingNode";
import {TracingStructure} from "../models/swc/tracingStructure";
import {MouseStrain} from "../models/sample/mouseStrain";
import {Injection} from "../models/sample/injection";
import {Tracing} from "../models/transform/tracing";
import {SearchTracingStructure} from "../models/search/tracingStructure";
import {SearchMouseStrain} from "../models/search/mouseStrain";
import {CcfV25BrainCompartment} from "../models/transform/ccfv25BrainCompartmentContents";

const debug = require("debug")("mnb:data:search:generate-contents");

enum ShareVisibility {
    DoNotShare = 0,
    Inherited = 0x01,
    ShareAllInternal = 0x02,
    ShareAllExternal = 0x04
}

const Op = Sequelize.Op;

const NODE_INSERT_INCREMENT = 25000;

// All samples
const sampleMap = new Map<string, SearchSample>();

// All neurons
const neuronMap = new Map<string, SearchNeuron>();

// Neurons that have been flagged as changed.  Must upsert compartment maps even if source tracing has not
// been updated.  Could be a change to neuron visibility.
const requiredNeurons = new Array<string>();

// Track neurons that have been updated and whose brain area is specified rather than inherited from its tracings.  In
// this case we need to override the soma and search content brain areas later, but by the time we do that we've already
// updated the actual neuron entry with the inherited value and there is no way to distinguish.
const neuronsWithUserDefinedBrainArea: string[] = [];

const tracingsMap = new Map<string, SearchTracing>();

const updateRequiredForTracings: string[] = [];

const tracingsSomaMap = new Map<string, SearchTracingNodeAttributes>();

let sampleRemoveIds: string[] = [];
let neuronRemoveIds: string[] = [];
let tracingRemoveIds: string[] = [];

const minVisibility = process.argv.length > 2 ? parseInt(process.argv[2]) : ShareVisibility.DoNotShare;

debug(`using min visibility level of ${minVisibility}`);

generateContents().then((success: boolean) => {
    debug(`translation complete ${success ? "successfully" : "with error"}`);

    process.exit(0);
});

function generateContents(): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
        try {
            await RemoteDatabaseClient.Start("sample", DatabaseOptions.sample);
            await RemoteDatabaseClient.Start("swc", DatabaseOptions.swc);
            await RemoteDatabaseClient.Start("transform", DatabaseOptions.transform);
            await RemoteDatabaseClient.Start("search", DatabaseOptions.search);

            await syncBrainAreas();

            await syncStructureIdentifiers();

            await syncTracingStructures();

            await syncMouseStrains();

            await syncSamples();

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
    await simpleSync(BrainArea, SearchBrainArea, "brain areas");
}

async function syncStructureIdentifiers() {
    await simpleSync(StructureIdentifier, SearchStructureIdentifier, "structure identifiers");
}

async function syncTracingStructures() {
    await simpleSync(TracingStructure, SearchTracingStructure, "tracing structures");
}

async function syncMouseStrains() {
    await simpleSync(MouseStrain, SearchMouseStrain, "mouse strains");
}

async function syncSamples() {
    let input: Sample[] = await Sample.findAll({
        include: [{
            model: MouseStrain,
            as: "mouseStrain"
        }]
    });

    debug(`found ${input.length} samples`);

    input = input.filter(s => {
        return s.sharing >= minVisibility;
    });

    debug(`${input.length} input samples meet visibility requirements`);

    const output: SearchSample[] = await SearchSample.findAll({});

    debug(`found ${output.length} existing samples`);

    // All known samples in search database to we can look up existing.  The global sampleMap should only be samples
    // will be part of the updated database to drive downstream entity behaviors.
    const localSampleMap = new Map<string, SearchSample>();

    output.map(s => localSampleMap.set(s.id, s));

    let skipped = 0;

    await Promise.all(input.map(async (s) => {
        const sample = localSampleMap.get(s.id);

        if (!sample || s.updatedAt > sample.updatedAt) {
            const searchSample: SearchSampleAttributes = Object.assign(s.toJSON(), {searchScope: SearchScope.Team});

            switch (s.sharing) {
                case ShareVisibility.ShareAllExternal:
                    searchSample.searchScope = SearchScope.Public;
                    break;
                case ShareVisibility.ShareAllInternal:
                    searchSample.searchScope = SearchScope.Internal;
                    break;
                case ShareVisibility.DoNotShare:
                    searchSample.searchScope = SearchScope.Team;
                    break;
                default:
                    debug(`could not determine visibility of ${s.idNumber} - defaulting to private`);
                    searchSample.searchScope = SearchScope.Private;
            }

            searchSample.updatedAt = new Date();

            const [model] = await SearchSample.upsert(searchSample, {returning: true});

            sampleMap.set(model.id, model);

        } else {
            sampleMap.set(sample.id, sample);
            skipped++;
        }
    }));

    if (skipped > 0) {
        debug(`${skipped} samples did not change and were skipped`);
    }

    sampleRemoveIds = _.differenceBy(output, input, "id").map(r => r.id);

    if (sampleRemoveIds.length > 0) {
        debug(`${sampleRemoveIds.length} neuron(s) pending removal`);
    }
}

async function syncNeurons() {
    let input: Neuron[] = await Neuron.findAll({
        include: [{
            model: Injection,
            as: "injection",
            include: [{
                model: Sample,
                as: "sample"
            }]
        }]
    });

    debug(`found ${input.length} input neurons`);

    input = input.filter(n => {
        const visibility = n.sharing === ShareVisibility.Inherited ? n.injection.sample.sharing : n.sharing;
        return visibility >= minVisibility;
    });

    debug(`${input.length} input neurons meet visibility requirements`);

    const output: SearchNeuron[] = await SearchNeuron.findAll({});

    debug(`found ${output.length} existing neurons`);

    // All known neurons in search database to we can look up existing.  The global neuronMap should only be neurons
    // will be part of the updated database to drive downstream entity behaviors.
    const localNeuronMap = new Map<string, SearchNeuron>();

    output.map(n => localNeuronMap.set(n.id, n));

    let skipped = 0;

    const somaStructureIdentifier = await SearchStructureIdentifier.findOne({where: {value: StructureIdentifiers.soma}});

    await Promise.all(input.map(async (n) => {
        const neuron = localNeuronMap.get(n.id);
        const sample = sampleMap.get(n.injection.sampleId);

        if (!neuron || n.updatedAt > neuron.updatedAt || sample.updatedAt > neuron.updatedAt) {
            const searchNeuron: SearchNeuronAttributes = Object.assign(n.toJSON(), {searchScope: SearchScope.Team, sampleId: n.injection.sample.id});

            let userDefinedBrainArea = false;

            if (n.brainAreaId !== null) {
                userDefinedBrainArea = true;
                // debug(`neuron ${n.idString} is user defined brain area`);
            } else {
                // debug(`neuron ${n.idString} requires brain area lookup`);
                const swcTracings = await SwcTracing.findAll({
                    where: {neuronId: n.id}
                });

                if (swcTracings.length > 0) {
                    const tracings = await Tracing.findAll({
                        where: {swcTracingId: {[Op.in]: swcTracings.map(s => s.id)}}
                    });

                    if (tracings.length > 0) {
                        const somas = await TracingNode.findAll({
                            where: {
                                tracingId: {[Op.in]: tracings.map(t => t.id)},
                                structureIdentifierId: somaStructureIdentifier.id
                            }
                        });

                        if (somas.length === 0) {
                            debug(`neuron ${n.idString} requires soma look up but there are no somas in the tracings`);
                        }

                        let idx = 0;

                        let found = false;

                        while (idx < somas.length) {
                            if (somas[idx].brainAreaIdCcfV25 !== null) {
                                searchNeuron.brainAreaId = somas[idx].brainAreaIdCcfV25;
                                found = true;
                                break;
                            }
                            idx++;
                        }

                        if (!found) {
                            debug(`neuron ${n.idString} requires soma look up but there are none of the somas reference a brain area`);
                        }

                    } else {
                        debug(`neuron ${n.idString} requires soma look up but has no transformed tracings`);
                    }
                } else {
                    debug(`neuron ${n.idString} requires soma look up but has no swc tracings`);
                }

                if (searchNeuron.brainAreaId === null) {
                    debug(`failed to look up brain area id for neuron ${n.idString} from tracings`);
                }
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

            searchNeuron.consensus = n.consensus;

            searchNeuron.updatedAt = new Date();

            const [model] = await SearchNeuron.upsert(searchNeuron, {returning: true});

            requiredNeurons.push(model.id);

            neuronMap.set(model.id, model);

            if (userDefinedBrainArea) {
                neuronsWithUserDefinedBrainArea.push(model.id);
            }
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
    const swcTracings = await SwcTracing.findAll({
        where: {neuronId: {[Op.in]: Array.from(neuronMap.keys())}}
    });

    debug(`neurons map to ${swcTracings.length} swc tracings`);

    const swcTracingMap = new Map<string, SwcTracing>();

    swcTracings.map(s => swcTracingMap.set(s.id, s));

    const inTracings = await Tracing.findAll({
        where: {swcTracingId: {[Op.in]: Array.from(swcTracingMap.keys())}}
    });

    debug(`evaluating ${inTracings.length} registered tracings from swc tracings`);

    const existingTracings: SearchTracing[] = await SearchTracing.findAll({
        where: {neuronId: {[Op.in]: Array.from(neuronMap.keys())}}
    });

    debug(`${existingTracings.length} search db tracings already exist and may require an update`);

    existingTracings.map(t => tracingsMap.set(t.id, t));

    let skipped = 0;
    let missingNeuron = 0;

    await Promise.all(inTracings.map(async (t) => {
        const tracing = tracingsMap.get(t.id);

        const swcTracing = await SwcTracing.findByPk(t.swcTracingId);

        const neuron = await Neuron.findByPk(swcTracing.neuronId);

        if (!tracing || t.updatedAt > tracing.updatedAt || swcTracing.updatedAt > tracing.updatedAt || (neuron !== null && (neuron.updatedAt > tracing.updatedAt))) {
            const searchTracing: SearchTracingAttributes = Object.assign(t.toJSON());

            searchTracing.neuronId = swcTracing.neuronId;
            searchTracing.tracingStructureId = swcTracing.tracingStructureId;
            searchTracing.somaId = null; // Reset - will be dropping all nodes and regenerating them.

            const [model] = await SearchTracing.upsert(searchTracing, {returning: true});

            tracingsMap.set(model.id, model);

            updateRequiredForTracings.push(model.id);

            await SearchContent.destroy({where: {tracingId: model.id}});
            await SearchTracingNode.destroy({where: {tracingId: model.id}});
        } else {
            skipped++;
        }
    }));

    debug(`added or updated ${tracingsMap.size - skipped - missingNeuron} tracings from ${neuronMap.size} neurons`);

    if (skipped > 0) {
        debug(`${skipped} tracings did not change and were skipped`);
    }

    const allSearchTracings: SearchTracing[] = await SearchTracing.findAll({
        attributes: ["id"]
    });

    tracingRemoveIds = _.differenceBy(allSearchTracings, inTracings, "id").map(r => r.id);

    if (tracingRemoveIds.length > 0) {
        debug(`${tracingRemoveIds.length} tracing(s) pending removal`);
    }
}

async function syncNodes() {
    if (updateRequiredForTracings.length === 0 && requiredNeurons.length === 0) {
        debug(`no tracings require node updates`);
        return;
    }

    const count = await TracingNode.count({where: {tracingId: {[Op.in]: updateRequiredForTracings}}});

    let offset = 0;

    debug(`syncing ${count} nodes`);

    while (offset < count) {
        const nodes = await TracingNode.findAll({
            order: [["id", "ASC"]],
            offset,
            limit: NODE_INSERT_INCREMENT,
            where: {tracingId: {[Op.in]: updateRequiredForTracings}}
        });

        await SearchTracingNode.bulkCreate(nodes.map(n => n.toJSON()));

        debug(`${offset + nodes.length} inserted`);

        offset += NODE_INSERT_INCREMENT;
    }

    debug(`updating soma node brain areas from neuron`);

    // So long as there are only thousand(s) of tracings, just update them all for that are linked to neurons where the
    // soma brain area is specified.  At some point, should just pull the merged set of tracings that changed plus
    // tracings of neurons that changed.
    const neurons = await SearchNeuron.findAll({
        where: {brainAreaId: {[Op.ne]: null}},
        attributes: ["id"]
    });

    debug(`${neurons.length} have soma brain area specified`);

    const tracings = await SearchTracing.findAll({where: {neuronId: {[Op.in]: neurons.map(n => n.id)}}});

    debug(`updating soma brain area for ${tracings.length} tracings`);

    const somaStructureIdentifier = await SearchStructureIdentifier.findOne({where: {value: StructureIdentifiers.soma}});

    // Setting this here so that sync of the tracing-soma map uses the correct value.
    await Promise.all(tracings.map(async (t) => {
        if (neuronsWithUserDefinedBrainArea.some(id => id === t.neuronId)) {
            const soma = await SearchTracingNode.findOne({
                where: {
                    tracingId: t.id,
                    structureIdentifierId: somaStructureIdentifier.id
                }
            });

            if (soma) {
                await soma.update({brainAreaId: neuronMap.get(t.neuronId).brainAreaId});
                debug(`setting soma for tracing ${t.id}`);
            } else {
                debug(`no soma for tracing ${t.id}`);
            }
        }
    }));
}

// There is no longer any table for this, but will use the generated map as a fast, synchronous lookup for generating
// the search content table.
async function syncTracingSomaMap() {
    // const tracings = await storageManager.Search.Tracing.findAll({where: {id: {[Op.in]: updateRequiredForTracings}}});
    const tracings = await SearchTracing.findAll();

    debug(`create map for ${tracings.length} tracing soma`);

    const somaStructureIdentifier = await SearchStructureIdentifier.findOne({where: {value: StructureIdentifiers.soma}});

    await Promise.all(tracings.map(async (t) => {
        const soma = await TracingNode.findOne({
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
            debug(`no soma for tracing ${t.id}`);
        }
    }));
}

async function syncSearchContent() {
    if (updateRequiredForTracings.length === 0 && requiredNeurons.length === 0) {
        debug(`no search content updates are required`);
        return;
    }

    debug(`${updateRequiredForTracings.length} tracings and ${requiredNeurons.length} neurons triggering contents update`);

    const tracingsForNeurons = await SearchTracing.findAll({where: {neuronId: {[Op.in]: requiredNeurons}}});

    const allTracings = _.uniq(updateRequiredForTracings.concat(tracingsForNeurons.map(t => t.id)));

    debug(`resolved to ${allTracings.length} tracings`);

    const input = await CcfV25BrainCompartment.findAll({
        where: {
            tracingId: {[Op.in]: allTracings}
        }
    });

    debug(`resolved to ${input.length} search contents`);

    await SearchContent.destroy({where: {tracingId: {[Op.in]: allTracings}}});

    const objs = input.map(c => {
        const obj: SearchContentAttributes = c.toJSON();

        const tracing = tracingsMap.get(c.tracingId);

        const neuron = neuronMap.get(tracing.neuronId);

        if (neuron) {
            obj.neuronId = neuron.id;
        } else {
            debug(`no neuron for tracing ${tracing.id} referencing ${tracing.neuronId}`);
            return null;
        }

        const soma: SearchTracingNodeAttributes = tracingsSomaMap.get(tracing.id);

        if (!soma) {
            debug(`no soma for tracing ${tracing.id} referencing ${tracing.neuronId}`);
            return null;
        }

        obj.somaX = soma.x;
        obj.somaY = soma.y;
        obj.somaZ = soma.z;

        obj.tracingStructureId = tracing.tracingStructureId;

        obj.neuronIdString = neuron.idString;
        obj.neuronDOI = neuron.doi;
        obj.neuronConsensus = neuron.consensus;

        obj.searchScope = neuron.searchScope;

        return obj;
    }).filter(s => s !== null);

    debug(`bulk create ${input.length} search contents`);

    while (objs.length > 0) {
        const batch = objs.splice(0, 1000);
        await SearchContent.bulkCreate(batch);
        debug(`${objs.length} search content remain`);
    }

    debug(`search content complete`);


    debug(`updating search content rows for neurons with soma brain area defined`);

    // This should be doable in one step since there should only be one entry per tracing with a soma count > 0.
    const somaContentRows = await SearchContent.findAll({
        where: {
            tracingId: {[Op.in]: allTracings},
            somaCount: {[Op.gt]: 0}
        }
    });

    const rowsToUpdate = somaContentRows.filter(s => {
        return neuronsWithUserDefinedBrainArea.some(id => id === s.neuronId);
    });

    debug(`found ${rowsToUpdate.length} contents whose neurons have non-null brainAreaId`);

    await Promise.all(rowsToUpdate.map(async (s) => {
        const somaCount = s.somaCount;

        await s.update({somaCount: 0, nodeCount: s.nodeCount - somaCount});

        const other = await SearchContent.findOne({
            where: {
                tracingId: s.tracingId,
                brainAreaId: neuronMap.get(s.neuronId).brainAreaId
            }
        });

        if (other) {
            await other.update({somaCount, nodeCount: other.nodeCount + somaCount});
        } else {
            const obj: SearchContentAttributes = s.toJSON();
            obj.id = uuid.v4();
            obj.brainAreaId = neuronMap.get(s.neuronId).brainAreaId;
            obj.nodeCount = somaCount;
            obj.somaCount = somaCount;
            obj.pathCount = 0;
            obj.branchCount = 0;
            obj.endCount = 0;

            await SearchContent.create(obj, {isNewRecord: true});
        }
    }));
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

    const count = await SearchContent.count({where});

    if (count > 0) {
        debug(`${count} search content are obsolete and will be removed`);
        await SearchContent.destroy({where});
    }
}

async function removeTracings() {
    if (tracingRemoveIds.length === 0) {
        return;
    }

    debug(`${tracingRemoveIds.length} tracings are obsolete and will be removed`);

    // Unlink circular dependency to remove entities.
    await SearchTracing.update({somaId: null}, {where: {somaId: {[Op.ne]: null}}});

    await SearchTracingNode.destroy({where: {tracingId: {[Op.in]: tracingRemoveIds}}});
    await SearchTracing.destroy({where: {id: {[Op.in]: tracingRemoveIds}}});
}

async function removeNeurons() {
    if (neuronRemoveIds.length === 0) {
        return;
    }

    debug(`${neuronRemoveIds.length} neurons are obsolete and will be removed`);

    await SearchNeuron.destroy({
        where: {
            id: {
                [Op.in]: neuronRemoveIds
            }
        }
    });
}
