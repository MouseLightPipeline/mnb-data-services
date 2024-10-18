import {DataTypes, BelongsToGetAssociationMixin, WhereOptions} from "sequelize";

import {ConsensusStatus, SearchNeuron, SearchScope} from "./neuron";
import {BaseModel} from "../baseModel";
import {SearchTracingStructure} from "./tracingStructure";
import {SearchTracing} from "./tracing";
import {SearchBrainArea} from "./brainArea";

export type SearchContentAttributes = {
    id: string;
    neuronId: string;
    searchScope: SearchScope;
    neuronIdString: string;
    neuronDOI: string;
    neuronConsensus: ConsensusStatus;
    somaX: number;
    somaY: number;
    somaZ: number;
    nodeCount: number;
    somaCount: number;
    pathCount: number;
    branchCount: number;
    endCount: number;
    tracingId: string;
    brainAreaId: string;
    tracingStructureId: string;
    manualSomaCompartmentId?: string;
    legacySomaIds?: string;
}

export class SearchContentBase extends BaseModel implements SearchContentAttributes {
    public neuronId: string;
    public searchScope: SearchScope;
    public neuronIdString: string;
    public neuronDOI: string;
    public neuronConsensus: ConsensusStatus;
    public somaX: number;
    public somaY: number;
    public somaZ: number;
    public nodeCount: number;
    public somaCount: number;
    public pathCount: number;
    public branchCount: number;
    public endCount: number;
    public tracingId: string;
    public brainAreaId: string;
    public tracingStructureId: string;
    public manualSomaCompartmentId?: string;
    public legacySomaIds?: string;

    public brainArea?: SearchBrainArea;
    public neuron?: SearchNeuron;
    public tracing?: SearchTracing;
    public tracingStructure?: SearchTracingStructure;
    public manualSomaCompartment?: SearchBrainArea;
    public legacySomaCompartments?: SearchBrainArea[];

    public getBrainArea!: BelongsToGetAssociationMixin<SearchBrainArea>;
    public getNeuron!: BelongsToGetAssociationMixin<SearchNeuron>;
    public getTracing!: BelongsToGetAssociationMixin<SearchTracing>;
    public getTracingStructure!: BelongsToGetAssociationMixin<SearchTracingStructure>;
    public getManualSomaCompartment!: BelongsToGetAssociationMixin<SearchBrainArea>;
}

export interface ICompartmentContentForTracingIdsWithSoma {
    (tracingIds: string[]): Promise<SearchContentBase[]>;
}

export interface ICompartmentContentForTracingIdWithCompartment {
    (tracingId: string, compartmentId: string): Promise<SearchContentBase>;
}

export interface ICompartmentContentDestroyForTracingIds {
    (tracingIds: string[]): Promise<void>;
}

export interface ICompartmentContentAddAll {
    (content: SearchContentAttributes[]): Promise<void>;
}

export interface ICompartmentContentAddNew {
    (content: SearchContentAttributes): Promise<void>;
}

export interface ICompartmentContentRemoveWhere {
    (where: WhereOptions): Promise<number>;
}

export interface ISearchContentOptimize {
    findForTracingIdsWithSoma: ICompartmentContentForTracingIdsWithSoma;

    findForTracingIdWithCompartment: ICompartmentContentForTracingIdWithCompartment;

    destroyForTracingIds: ICompartmentContentDestroyForTracingIds;

    addAll: ICompartmentContentAddAll;

    addNew: ICompartmentContentAddNew;
}

export const SearchContentModelAttributes = {
    id: {
        primaryKey: true,
        type: DataTypes.UUID
    },
    neuronIdString: DataTypes.TEXT,
    neuronDOI: DataTypes.TEXT,
    searchScope: DataTypes.INTEGER,
    neuronConsensus: DataTypes.INTEGER,
    somaX: DataTypes.DOUBLE,
    somaY: DataTypes.DOUBLE,
    somaZ: DataTypes.DOUBLE,
    nodeCount: DataTypes.INTEGER,
    somaCount: DataTypes.INTEGER,
    pathCount: DataTypes.INTEGER,
    branchCount: DataTypes.INTEGER,
    endCount: DataTypes.INTEGER,
    legacySomaIds: DataTypes.TEXT,
    legacySomaCompartments: {
        type: DataTypes.VIRTUAL(DataTypes.ARRAY, ["legacySomaIds"]),
        get: function (): string[] {
            const ids = JSON.parse(this.getDataValue("legacySomaIds")) || [];
            return ids.map(id => SearchBrainArea.getOne(id));
        },
        set: function (value: string[]) {
            if (value && value.length === 0) {
                value = null;
            }

            this.setDataValue("legacySomaIds", JSON.stringify(value));
        }
    }
};
