import {BelongsToGetAssociationMixin, DataTypes, Sequelize} from "sequelize";

import {BaseModel} from "../baseModel";
import {SearchTracing} from "./tracing";
import {SearchStructureIdentifier} from "./structureIdentifier";
import {SearchBrainArea} from "./brainArea";

export type SearchTracingNodeAttributes = {
    sampleNumber?: number;
    parentNumber?: number;
    x?: number;
    y?: number;
    z?: number;
    radius?: number;
    lengthToParent?: number;
    structureIdentifierId?: string;
    brainAreaId?: string;
}

export class SearchTracingNode extends BaseModel {
    public sampleNumber: number;
    public parentNumber: number;
    public x: number;
    public y: number;
    public z: number;
    public radius: number;
    public lengthToParent: number;
    public structureIdentifierId: string;
    public brainAreaIdCcfV25: string;
    public brainAreaIdCcfV30: string;

    public getTracing!: BelongsToGetAssociationMixin<SearchTracing>;
}

export const modelInit = (sequelize: Sequelize) => {
    SearchTracingNode.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        // Unchanged values
        sampleNumber: DataTypes.INTEGER,
        parentNumber: DataTypes.INTEGER,
        radius: DataTypes.DOUBLE,
        lengthToParent: DataTypes.DOUBLE,
        structureIdentifierId: DataTypes.UUID,
        // Modified values
        x: DataTypes.DOUBLE,
        y: DataTypes.DOUBLE,
        z: DataTypes.DOUBLE,
        // Outside refs
        swcNodeId: DataTypes.UUID,
        brainAreaIdCcfV25: DataTypes.UUID,
        brainAreaIdCcfV30: DataTypes.UUID
    }, {
        tableName: "TracingNode",
        timestamps: false,
        sequelize
    });
};

export const modelAssociate = () => {
    SearchTracingNode.belongsTo(SearchTracing, {foreignKey: "tracingId"});
    SearchTracingNode.belongsTo(SearchStructureIdentifier, {foreignKey: "structureIdentifierId"});
    SearchTracingNode.belongsTo(SearchBrainArea, {foreignKey: "brainAreaIdCcfV25", as: "brainAreaCcfV25"});
    SearchTracingNode.belongsTo(SearchBrainArea, {foreignKey: "brainAreaIdCcfV30", as: "brainAreaCcfV30"});
};