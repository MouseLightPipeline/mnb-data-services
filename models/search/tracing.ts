import {BelongsToGetAssociationMixin, DataTypes, HasManyGetAssociationsMixin, Sequelize} from "sequelize";

import {BaseModel} from "../baseModel";
import {SearchTracingNode} from "./tracingNode";
import {SearchTracingStructure} from "./tracingStructure";
import {SearchNeuron} from "./neuron";
import {CcfV25SearchContent} from "./ccfV25SearchContent";
import {CcfV30SearchContent} from "./ccfV30SearchContent";

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
    public tracingStructureId: string;
    public neuronId: string;

    public getNodes!: HasManyGetAssociationsMixin<SearchTracingNode>;
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
    SearchTracing.belongsTo(SearchTracingStructure, {foreignKey: "tracingStructureId", as: "tracingStructure"});
    SearchTracing.hasMany(SearchTracingNode, {foreignKey: "tracingId", as: "nodes"});
    SearchTracing.belongsTo(SearchTracingNode, {foreignKey: "somaId", as: "soma"});
    SearchTracing.belongsTo(SearchNeuron, {foreignKey: "neuronId"});
    SearchTracing.hasMany(CcfV25SearchContent, {foreignKey: "tracingId"});
    SearchTracing.hasMany(CcfV30SearchContent, {foreignKey: "tracingId"});
};
