import {IBrainArea} from "ndb-data-models";

export interface ITracingNode {
    id: string;
    tracingId: string;
    swcNodeId: string;
    sampleNumber: number;
    parentNumber: number;
    x: number;
    y: number;
    z: number;
    radius: number;
    lengthToParent: number;
    structureIdentifierId: string;
    brainAreaId: string;
    brainArea?: IBrainArea;
    createdAt: Date;
    updatedAt: Date;
}

export interface INodePage {
    offset: number;
    limit: number;
    totalCount: number;
    hasNextPage: boolean;
    nodes: ITracingNode[];
}

export const TableName = "TracingNode";

export function sequelizeImport(sequelize, DataTypes) {
    const TracingNode = sequelize.define(TableName, {
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
        brainAreaId: DataTypes.UUID
    }, {
        classMethods: {
            associate: models => {
                TracingNode.belongsTo(models.Tracing, {foreignKey: "tracingId"});
            }
        },
        timestamps: true,
        paranoid: false
    });

    return TracingNode;
}
