import {Op} from "sequelize";
import * as _ from "lodash";
import uuid = require("uuid");
import * as progress from "cli-progress";

const debug = require("debug")("mnb:data:search:generate-contents");

import {CcfV30SearchContent} from "../models/search/ccfV30SearchContent";
import {
    CcfV25CompartmentSearchContent,
    ICompartmentContentFindForTracingIds
} from "../models/transform/ccfv25CompartmentSearchContent";
import {SearchSample, SearchSampleAttributes} from "../models/search/sample";
import {SearchNeuron, SearchNeuronAttributes, SearchScope} from "../models/search/neuron";
import {SearchTracing, SearchTracingAttributes} from "../models/search/tracing";
import {SearchTracingNode, SearchTracingNodeAttributes} from "../models/search/tracingNode";
import {CcfV25SearchContent} from "../models/search/ccfV25SearchContent";
import {CcfV30CompartmentSearchContent} from "../models/transform/ccfV30CompartmentSearchContent";
import {BrainArea} from "../models/sample/brainArea";
import {SearchBrainArea} from "../models/search/brainArea";
import {StructureIdentifier, StructureIdentifiers} from "../models/swc/structureIdentifier";
import {SearchStructureIdentifier} from "../models/search/structureIdentifier";
import {TracingStructure} from "../models/swc/tracingStructure";
import {SearchTracingStructure} from "../models/search/tracingStructure";
import {MouseStrain} from "../models/sample/mouseStrain";
import {SearchMouseStrain} from "../models/search/mouseStrain";
import {Sample} from "../models/sample/sample";
import {Neuron} from "../models/sample/neuron";
import {Injection} from "../models/sample/injection";
import {SwcTracing} from "../models/swc/swcTracing";
import {Tracing} from "../models/transform/tracing";
import {TracingNode} from "../models/transform/tracingNode";
import {
    ICompartmentContentRemoveWhere,
    ISearchContentOptimize,
    SearchContentAttributes
} from "../models/search/searchContent";

const NODE_INSERT_INCREMENT = 25000;

const SEARCH_CONTENT_INSERT_INCREMENT = 1000;

const CHUNK_COUNT = 4;

export enum ShareVisibility {
    DoNotShare = 0,
    Inherited = 0x01,
    ShareAllInternal = 0x02,
    ShareAllExternal = 0x04
}

export class SearchOptimization {

    private readonly minVisibility: ShareVisibility;

    private readonly forceUpdate: boolean;

    // All samples
    private sampleMap = new Map<string, SearchSample>();

    // All neurons
    private neuronMap = new Map<string, SearchNeuron>();

    // Neurons that have been flagged as changed.  Must upsert compartment maps even if source tracing has not
    // been updated.  Could be a change to neuron visibility.
    private requiredNeurons = new Array<string>();

    // Track neurons that have been updated and whose brain area is specified rather than inherited from its tracings.  In
    // this case we need to override the soma and search content brain areas later, but by the time we do that we've already
    // updated the actual neuron entry with the inherited value and there is no way to distinguish.
    private neuronsWithUserDefinedBrainArea: string[] = [];

    private tracingsMap = new Map<string, SearchTracing>();

    private updateRequiredForTracings: string[] = [];

    private tracingsSomaMap = new Map<string, SearchTracingNodeAttributes>();

    private sampleRemoveIds: string[] = [];
    private neuronRemoveIds: string[] = [];
    private tracingRemoveIds: string[] = [];

    public static async optimize(minVisibility: ShareVisibility = ShareVisibility.DoNotShare, forceUpdate: boolean = false): Promise<boolean> {
        return (new SearchOptimization(minVisibility, forceUpdate).generateContents());
    }

    private constructor(minVisibility: ShareVisibility, forceUpdate: boolean) {
        this.minVisibility = minVisibility;

        this.forceUpdate = forceUpdate;
    }

    private generateContents(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            try {
                await SearchBrainArea.loadCompartmentCache();

                await this.syncBrainAreas();

                await this.syncStructureIdentifiers();

                await this.syncTracingStructures();

                await this.syncMouseStrains();

                await this.syncSamples();

                await this.syncNeurons();

                await this.syncTracings();

                await this.syncNodes();

                await this.syncTracingSomaMap();

                await this.syncSearchContent();

                await this.removeSearchContent(CcfV25SearchContent.removeWhere);
                await this.removeSearchContent(CcfV30SearchContent.removeWhere);

                await this.removeTracings();

                await this.removeNeurons();
            } catch (err) {
                debug(err);
                resolve(false);
            }

            resolve(true);
        });
    }

    private async syncBrainAreas() {
        await this.simpleSync(BrainArea, SearchBrainArea, "brain areas");
    }

    private async syncStructureIdentifiers() {
        await this.simpleSync(StructureIdentifier, SearchStructureIdentifier, "structure identifiers");
    }

    private async syncTracingStructures() {
        await this.simpleSync(TracingStructure, SearchTracingStructure, "tracing structures");
    }

    private async syncMouseStrains() {
        await this.simpleSync(MouseStrain, SearchMouseStrain, "mouse strains");
    }

    private async syncSamples() {
        let input: Sample[] = await Sample.findAll({
            include: [{
                model: MouseStrain,
                as: "mouseStrain"
            }]
        });

        debug(`found ${input.length} samples`);

        const neurons: Neuron[] = await Neuron.findAll({
            attributes: ["id", "sharing"],
            where: {sharing: {[Op.ne]: ShareVisibility.Inherited}},
            include: [{
                model: Injection,
                as: "injection",
                attributes: ["id"],
                include: [{
                    model: Sample,
                    as: "sample"
                }]
            }]
        });

        const dependentSampleIds = neurons.filter(n => n.sharing >= this.minVisibility).map(n => n.injection.sample.id);

        input = input.filter(s => {
            return s.sharing >= this.minVisibility || dependentSampleIds.some(id => id == s.id);
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

            if (this.forceUpdate || !sample || s.updatedAt > sample.updatedAt) {
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

                this.sampleMap.set(model.id, model);

            } else {
                this.sampleMap.set(sample.id, sample);
                skipped++;
            }
        }));

        if (skipped > 0) {
            debug(`${skipped} samples did not change and were skipped`);
        }

        this.sampleRemoveIds = _.differenceBy(output, input, "id").map(r => r.id);

        if (this.sampleRemoveIds.length > 0) {
            debug(`${this.sampleRemoveIds.length} neuron(s) pending removal`);
        }
    }

    private async syncNeurons() {
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

            return visibility >= this.minVisibility;
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

        const bar = new progress.SingleBar({}, progress.Presets.shades_classic);

        bar.start(input.length, 0);

        await Promise.all(input.map(async (n) => {
            const neuron = localNeuronMap.get(n.id);
            const sample = this.sampleMap.get(n.injection.sampleId);

            if (this.forceUpdate || !neuron || n.updatedAt > neuron.updatedAt || sample.updatedAt > neuron.updatedAt) {
                const searchNeuron: SearchNeuronAttributes = Object.assign(n.toJSON() as SearchNeuronAttributes, {
                    searchScope: SearchScope.Team,
                    sampleId: n.injection.sample.id
                });

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
                                if (somas[idx].brainAreaIdCcfV30 !== null) {
                                    searchNeuron.brainAreaId = somas[idx].brainAreaIdCcfV30;
                                    found = true;
                                    break;
                                }

                                if (somas[idx].brainAreaIdCcfV25 !== null) {
                                    searchNeuron.brainAreaId = somas[idx].brainAreaIdCcfV25;
                                    found = true;
                                    break;
                                }
                                idx++;
                            }

                            if (!found) {
                                debug(`neuron ${n.idString} required soma look up but none of the tracing soma nodes reference a brain area`);
                            }

                        } else {
                            debug(`neuron ${n.idString} required soma look up but has no transformed tracings`);
                        }
                    } else {
                        debug(`neuron ${n.idString} required soma look up but has no swc tracings`);
                    }

                    if (searchNeuron.brainAreaId === null) {
                        debug(`failed to look up brain area id for neuron ${n.idString} from tracings`);
                    }
                }

                if (n.metadata?.manualAnnotations?.somaCompartmentId != undefined) {
                    searchNeuron.manualSomaCompartmentId = SearchBrainArea.getByStructureId(n.metadata.manualAnnotations.somaCompartmentId)?.id ?? null;
                }

                if (n.metadata?.manualAnnotations?.curatedCompartmentId != undefined) {
                    searchNeuron.manualSomaCompartmentId = SearchBrainArea.getByStructureId(n.metadata.manualAnnotations.curatedCompartmentId)?.id ?? null;
                }

                if (n.metadata?.manualAnnotations?.legacyCompartmentIds && n.metadata.manualAnnotations.legacyCompartmentIds.length > 0) {
                    searchNeuron.legacySomaIds = JSON.stringify(n.metadata.manualAnnotations.legacyCompartmentIds.map(id => SearchBrainArea.getByStructureId(id)?.id));
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

                this.requiredNeurons.push(model.id);

                this.neuronMap.set(model.id, model);

                if (userDefinedBrainArea) {
                    this.neuronsWithUserDefinedBrainArea.push(model.id);
                }
            } else {
                this.neuronMap.set(neuron.id, neuron);
                skipped++;
            }

            bar.increment();
        }));

        bar.stop();

        if (skipped > 0) {
            debug(`${skipped} neurons did not change and were skipped`);
        }

        this.neuronRemoveIds = _.differenceBy(output, input, "id").map(r => r.id);

        if (this.neuronRemoveIds.length > 0) {
            debug(`${this.neuronRemoveIds.length} neuron(s) pending removal`);
        }
    }

    private async syncTracings() {
        // Tracings are once removed from neurons via the swc tracing.
        const swcTracings = await SwcTracing.findAll({
            where: {neuronId: {[Op.in]: Array.from(this.neuronMap.keys())}}
        });

        debug(`neurons map to ${swcTracings.length} swc tracings`);

        const swcTracingMap = new Map<string, SwcTracing>();

        swcTracings.map(s => swcTracingMap.set(s.id, s));

        const inTracings = await Tracing.findAll({
            where: {swcTracingId: {[Op.in]: Array.from(swcTracingMap.keys())}}
        });

        debug(`evaluating ${inTracings.length} registered tracings from swc tracings`);

        const existingTracings: SearchTracing[] = await SearchTracing.findAll({
            where: {neuronId: {[Op.in]: Array.from(this.neuronMap.keys())}}
        });

        debug(`${existingTracings.length} search db tracings already exist and may require an update`);

        existingTracings.map(t => this.tracingsMap.set(t.id, t));

        let skipped = 0;
        let missingNeuron = 0;

        const pieces = splitArray(inTracings, CHUNK_COUNT);

        const bar = new progress.SingleBar({}, progress.Presets.shades_classic);

        bar.start(existingTracings.length, 0);

        const promises = pieces.map(async (piece) => {
            await piece.reduce(async (prev: Promise<Tracing>, t: Tracing): Promise<boolean> => {
                await prev;

                const didUpdate = await this.syncTracing(t, bar);

                if (!didUpdate) {
                    skipped++;
                }

                return didUpdate;
            }, Promise.resolve(null));
        });

        await Promise.all(promises);

        bar.stop();

        debug(`added or updated ${this.tracingsMap.size - skipped - missingNeuron} tracings from ${this.neuronMap.size} neurons`);

        if (skipped > 0) {
            debug(`${skipped} tracings did not change and were skipped`);
        }

        const allSearchTracings: SearchTracing[] = await SearchTracing.findAll({
            attributes: ["id"]
        });

        this.tracingRemoveIds = _.differenceBy(allSearchTracings, inTracings, "id").map(r => r.id);

        if (this.tracingRemoveIds.length > 0) {
            debug(`${this.tracingRemoveIds.length} tracing(s) pending removal`);
        }
    }


    private async syncTracing(t: Tracing, bar): Promise<boolean> {
        const tracing = this.tracingsMap.get(t.id);

        const swcTracing = await SwcTracing.findByPk(t.swcTracingId);

        const neuron = await Neuron.findByPk(swcTracing.neuronId);

        let skipped = false;

        if (this.forceUpdate || !tracing || t.updatedAt > tracing.updatedAt || swcTracing.updatedAt > tracing.updatedAt || (neuron !== null && (neuron.updatedAt > tracing.updatedAt))) {
            const searchTracing: SearchTracingAttributes = Object.assign(t.toJSON());

            searchTracing.neuronId = swcTracing.neuronId;
            searchTracing.tracingStructureId = swcTracing.tracingStructureId;
            searchTracing.somaId = null; // Reset - will be dropping all nodes and regenerating them.

            const [model] = await SearchTracing.upsert(searchTracing, {returning: true});

            this.tracingsMap.set(model.id, model);

            this.updateRequiredForTracings.push(model.id);

            await CcfV25SearchContent.destroy({where: {tracingId: model.id}});
            await CcfV30SearchContent.destroy({where: {tracingId: model.id}});
            await SearchTracingNode.destroy({where: {tracingId: model.id}});
        } else {
            skipped = true;
        }

        bar.increment();

        return skipped;
    }

    private async syncNodes() {
        if (this.updateRequiredForTracings.length === 0 && this.requiredNeurons.length === 0) {
            debug(`no tracings require node updates`);
            return;
        }

        const count = await TracingNode.count({where: {tracingId: {[Op.in]: this.updateRequiredForTracings}}});

        let offset = 0;

        debug(`syncing ${count} nodes`);

        const bar = new progress.SingleBar({}, progress.Presets.shades_classic);

        bar.start(count, 0);

        while (offset < count) {
            const nodes = await TracingNode.findAll({
                order: [["id", "ASC"]],
                offset,
                limit: NODE_INSERT_INCREMENT,
                where: {tracingId: {[Op.in]: this.updateRequiredForTracings}}
            });

            await SearchTracingNode.bulkCreate(nodes.map(n => n.toJSON()));

            // debug(`${offset + nodes.length} inserted`);
            bar.increment(NODE_INSERT_INCREMENT);

            offset += NODE_INSERT_INCREMENT;
        }

        bar.stop();

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
            if (this.neuronsWithUserDefinedBrainArea.some(id => id === t.neuronId)) {
                const soma = await SearchTracingNode.findOne({
                    where: {
                        tracingId: t.id,
                        structureIdentifierId: somaStructureIdentifier.id
                    }
                });

                if (soma) {
                    const brainAreaId = this.neuronMap.get(t.neuronId).brainAreaId;
                    soma.brainAreaIdCcfV25 = brainAreaId;
                    soma.brainAreaIdCcfV30 = brainAreaId;
                    await soma.update({brainAreaIdCcfV25: brainAreaId, brainAreaIdCcfV30: brainAreaId}, {fields: ["brainAreaIdCcfV25", "brainAreaIdCcfV30"]});
                    debug(`setting soma for tracing ${t.id}`);
                } else {
                    debug(`no soma for tracing ${t.id}`);
                }
            }
        }));
    }

    // There is no longer any table for this, but will use the generated map as a fast, synchronous lookup for generating
    // the search content table.
    private async syncTracingSomaMap() {
        // const tracings = await storageManager.Search.Tracing.findAll({where: {id: {[Op.in]: updateRequiredForTracings}}});
        const tracings = await SearchTracing.findAll();

        debug(`create map for ${tracings.length} tracing soma`);

        const somaStructureIdentifier = await SearchStructureIdentifier.findOne({where: {value: StructureIdentifiers.soma}});

        await Promise.all(tracings.map(async (t) => {
            const soma = await SearchTracingNode.findOne({
                where: {
                    tracingId: t.id,
                    structureIdentifierId: somaStructureIdentifier.id
                }
            });

            if (soma) {
                this.tracingsSomaMap.set(t.id, soma);

                await t.update({somaId: soma.id});

                this.tracingsSomaMap.set(t.id, soma);
            } else {
                debug(`no soma for tracing ${t.id}`);
            }
        }));
    }

    private async syncSearchContent() {
        if (this.updateRequiredForTracings.length === 0 && this.requiredNeurons.length === 0) {
            debug(`no search content updates are required`);
            return;
        }

        debug(`${this.updateRequiredForTracings.length} tracings and ${this.requiredNeurons.length} neurons triggering contents update`);

        const tracingsForNeurons = await SearchTracing.findAll({where: {neuronId: {[Op.in]: this.requiredNeurons}}});

        const allTracings = _.uniq(this.updateRequiredForTracings.concat(tracingsForNeurons.map(t => t.id)));

        debug(`resolved to ${allTracings.length} tracings`);


        debug(`syncing CCF v2.5 search content`);
        await this.syncSearchContentTable(allTracings, CcfV25CompartmentSearchContent.findForTracingIds, CcfV25SearchContent);

        debug(`syncing CCF v3.0 search content`);
        await this.syncSearchContentTable(allTracings, CcfV30CompartmentSearchContent.findForTracingIds, CcfV30SearchContent);
    }

    private async syncSearchContentTable(tracingIds: string[], findForTracingIds: ICompartmentContentFindForTracingIds, searchCompartmentTable: ISearchContentOptimize) {
        const input = await findForTracingIds(tracingIds);

        debug(`resolved to ${input.length} search contents`);

        await searchCompartmentTable.destroyForTracingIds(tracingIds);

        const objs = input.map(c => {
            const obj: SearchContentAttributes = c.toJSON() as SearchContentAttributes;

            const tracing = this.tracingsMap.get(c.tracingId);

            const neuron = this.neuronMap.get(tracing.neuronId);

            if (!neuron) {
                debug(`no neuron for tracing ${tracing.id} referencing ${tracing.neuronId}`);
                return null;
            }

            const soma: SearchTracingNodeAttributes = this.tracingsSomaMap.get(tracing.id);

            if (!soma) {
                debug(`no soma for tracing ${tracing.id} referencing ${tracing.neuronId}`);
                return null;
            }

            obj.somaX = soma.x;
            obj.somaY = soma.y;
            obj.somaZ = soma.z;

            obj.tracingStructureId = tracing.tracingStructureId;

            obj.neuronId = neuron.id;
            obj.neuronIdString = neuron.idString;
            obj.neuronDOI = neuron.doi;
            obj.neuronConsensus = neuron.consensus;
            obj.manualSomaCompartmentId = neuron.manualSomaCompartmentId;

            obj.searchScope = neuron.searchScope;

            return obj;
        }).filter(s => s !== null);

        debug(`bulk create ${input.length} search contents`);

        const bar = new progress.SingleBar({}, progress.Presets.shades_classic);

        bar.start(input.length, 0);

        while (objs.length > 0) {
            const batch = objs.splice(0, SEARCH_CONTENT_INSERT_INCREMENT);

            await searchCompartmentTable.addAll(batch);

            bar.increment(SEARCH_CONTENT_INSERT_INCREMENT);
        }

        bar.stop();

        debug(`search content complete`);

        debug(`updating search content rows for neurons with soma brain area defined`);

        // This should be doable in one step since there should only be one entry per tracing with a soma count > 0.
        const somaContentRows = await searchCompartmentTable.findForTracingIdsWithSoma(tracingIds);

        const rowsToUpdate = somaContentRows.filter(s => {
            return this.neuronsWithUserDefinedBrainArea.some(id => id === s.neuronId);
        });

        debug(`found ${rowsToUpdate.length} contents whose neurons have non-null brainAreaId`);

        await Promise.all(rowsToUpdate.map(async (s) => {
            const somaCount = s.somaCount;

            await s.update({somaCount: 0, nodeCount: s.nodeCount - somaCount});

            const other = await searchCompartmentTable.findForTracingIdWithCompartment(s.tracingId, this.neuronMap.get(s.neuronId).brainAreaId);

            if (other) {
                await other.update({somaCount, nodeCount: other.nodeCount + somaCount});
            } else {
                const obj: SearchContentAttributes = s.toJSON() as SearchContentAttributes;
                obj.id = uuid.v4();
                obj.brainAreaId = this.neuronMap.get(s.neuronId).brainAreaId;
                obj.nodeCount = somaCount;
                obj.somaCount = somaCount;
                obj.pathCount = 0;
                obj.branchCount = 0;
                obj.endCount = 0;

                await searchCompartmentTable.addNew(obj);
            }
        }));
    }

    private async simpleSync(srcModel, dstModel, name: string) {
        const input = await srcModel.findAll({});

        debug(`Upsert ${input.length} ${name}`);

        await Promise.all(input.map(async (b) => {
            await dstModel.upsert(b.toJSON());
        }));
    }

    private async removeSearchContent(searchCompartmentTable: ICompartmentContentRemoveWhere) {
        if (this.tracingRemoveIds.length === 0 && this.neuronRemoveIds.length === 0) {
            return;
        }

        const where = {
            [Op.or]: [
                {
                    tracingId: {
                        [Op.in]: this.tracingRemoveIds
                    }
                }, {
                    neuronId: {
                        [Op.in]: this.neuronRemoveIds
                    }
                }
            ]
        };

        const count = await searchCompartmentTable(where);

        if (count > 0) {
            debug(`${count} search content were obsolete and removed`);
        }
    }

    private async removeTracings() {
        if (this.tracingRemoveIds.length === 0) {
            return;
        }

        debug(`${this.tracingRemoveIds.length} tracings are obsolete and will be removed`);

        // Unlink circular dependency to remove entities.
        await SearchTracing.update({somaId: null}, {where: {somaId: {[Op.ne]: null}}});

        await SearchTracingNode.destroy({where: {tracingId: {[Op.in]: this.tracingRemoveIds}}});
        await SearchTracing.destroy({where: {id: {[Op.in]: this.tracingRemoveIds}}});
    }

    private async removeNeurons() {
        if (this.neuronRemoveIds.length === 0) {
            return;
        }

        debug(`${this.neuronRemoveIds.length} neurons are obsolete and will be removed`);

        await SearchNeuron.destroy({
            where: {
                id: {
                    [Op.in]: this.neuronRemoveIds
                }
            }
        });
    }
}

function splitArray<T>(array: Array<T>, chunkCount: number): Array<Array<T>> {
    const output = [];

    const chunkSize = Math.floor(array.length / chunkCount);

    for (let idx = 0; idx < array.length; idx += chunkSize) {
        output.push(array.slice(idx, idx + chunkSize));
    }

    return output;
}
