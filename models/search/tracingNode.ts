import {Instance, Model} from "sequelize";

export interface ISearchTracingNodeAttributes {
    id: string;
    tracingId: string;
    structureIdentifierId: string;
    brainAreaId: string;
    swcNodeId: string;
    sampleNumber: number;
    parentNumber: number;
    x: number;
    y: number;
    z: number;
    radius: number;
    lengthToParent: number;
}

export interface ISearchTracingNode extends Instance<ISearchTracingNodeAttributes>, ISearchTracingNodeAttributes {
}

export interface ISearchTracingNodeTable extends Model<ISearchTracingNode, ISearchTracingNodeAttributes> {
}

export const TableName = "TracingNode";

export function sequelizeImport(sequelize, DataTypes) {
    const TracingNode = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        sampleNumber: DataTypes.INTEGER,
        parentNumber: DataTypes.INTEGER,
        radius: DataTypes.DOUBLE,
        lengthToParent: DataTypes.DOUBLE,
        x: DataTypes.DOUBLE,
        y: DataTypes.DOUBLE,
        z: DataTypes.DOUBLE,
        swcNodeId: DataTypes.UUID
    }, {
        timestamps: false,
        freezeTableName: true
    });

    TracingNode.associate = models => {
        TracingNode.belongsTo(models.Tracing, {foreignKey: "tracingId"});
        TracingNode.belongsTo(models.StructureIdentifier, {foreignKey: "structureIdentifierId"});
        TracingNode.belongsTo(models.BrainArea, {foreignKey: "brainAreaId"});
    };

    return TracingNode;
}
