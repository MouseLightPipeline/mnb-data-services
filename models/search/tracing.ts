import {BelongsToGetAssociationMixin, DataTypes, HasManyGetAssociationsMixin, Sequelize} from "sequelize";

import {BaseModel} from "../transform/baseModel";
import {SearchTracingNode} from "./tracingNode";
import {SearchTracingStructure} from "./tracingStructure";
import {SearchNeuron} from "./neuron";
import {SearchContent} from "./searchContent";

export type SearchTracingAttributes = {
    nodeCount?: number;
    pathCount?: number;
    branchCount?: number;
    endCount?: number;
    transformedAt?: Date;
    somaId?: string;
    neuronId?: string;
    tracingStructureId?: string;
    updatedAt?: Date;
}

export class SearchTracing extends BaseModel {
    public nodeCount: number;
    public pathCount: number;
    public branchCount: number;
    public endCount: number;
    public transformedAt: Date;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    public neuronId?: string;
    public tracingStructureId?: string;

    public getNodes!: HasManyGetAssociationsMixin<SearchTracingNode>;
    public getSearchContent!: HasManyGetAssociationsMixin<SearchContent>;
    public getSoma!: BelongsToGetAssociationMixin<SearchTracingNode>;
    public getNeuron!: BelongsToGetAssociationMixin<SearchNeuron>;
    public getTracingStructure!: BelongsToGetAssociationMixin<SearchTracingStructure>;

    public nodes?: SearchTracingNode[];
    public soma?: SearchTracingNode;
    public tracingStructure?: SearchTracingStructure;
}

export const modelInit = (sequelize: Sequelize) => {
    SearchTracing.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        nodeCount: DataTypes.INTEGER,
        pathCount: DataTypes.INTEGER,
        branchCount: DataTypes.INTEGER,
        endCount: DataTypes.INTEGER,
        transformedAt: DataTypes.DATE
    }, {
        tableName: "Tracing",
        timestamps: true,
        sequelize
    });
};

export const modelAssociate = () => {
    SearchTracing.hasMany(SearchTracingNode, {foreignKey: "tracingId", as: "nodes"});
    SearchTracing.hasMany(SearchContent, {foreignKey: "tracingId"});
    SearchTracing.belongsTo(SearchNeuron, {foreignKey: "neuronId"});
    SearchTracing.belongsTo(SearchTracingStructure, {foreignKey: "tracingStructureId", as: "tracingStructure"});
    SearchTracing.belongsTo(SearchTracingNode, {foreignKey: "somaId", as: "soma"});
};
