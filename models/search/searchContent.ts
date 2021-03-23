import {Sequelize, DataTypes} from "sequelize";

import {ConsensusStatus, SearchNeuron, SearchScope} from "./neuron";
import {BaseModel} from "../transform/baseModel";
import {SearchTracingStructure} from "./tracingStructure";
import {SearchTracing} from "./tracing";
import {SearchBrainArea} from "./brainArea";

export type SearchContentAttributes = {
    id?: string;
    brainAreaId?: string;
    neuronId?: string;
    tracingStructureId?: string;
    searchScope?: SearchScope;
    neuronIdString?: string;
    neuronDOI?: string;
    neuronConsensus?: ConsensusStatus;
    somaX?: number;
    somaY?: number;
    somaZ?: number;
    nodeCount?: number;
    somaCount?: number;
    pathCount?: number;
    branchCount?: number;
    endCount?: number;
    tracingId?: string;
}

export class SearchContent extends BaseModel {
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

    public tracingId?: string;
}

export const modelInit = (sequelize: Sequelize) => {
    SearchContent.init({
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
        endCount: DataTypes.INTEGER
    }, {
        tableName: "SearchContent",
        timestamps: false,
        sequelize
    });
};

export const modelAssociate = () => {
    SearchContent.belongsTo(SearchTracing, {foreignKey: "tracingId"});
    SearchContent.belongsTo(SearchBrainArea, {foreignKey: "brainAreaId"});
    SearchContent.belongsTo(SearchNeuron, {foreignKey: "neuronId"});
    SearchContent.belongsTo(SearchTracingStructure, {foreignKey: "tracingStructureId"});
};
