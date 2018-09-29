export interface ISwcNode {
    id: string;
    swcTracingId: string;
    sampleNumber: number;
    x: number;
    y: number;
    z: number;
    radius: number;
    parentNumber: number;
    structureIdentifierId: string;
}

export const TableName = "SwcTracingNode";

export function sequelizeImport(sequelize, DataTypes) {
    const TracingNode = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        sampleNumber: DataTypes.INTEGER,
        x: DataTypes.DOUBLE,
        y: DataTypes.DOUBLE,
        z: DataTypes.DOUBLE,
        radius: DataTypes.DOUBLE,
        parentNumber: DataTypes.INTEGER
    }, {
        timestamps: true,
        paranoid: false
    });

    TracingNode.associate = models => {
        TracingNode.belongsTo(models.StructureIdentifier, {foreignKey: "structureIdentifierId"});
        TracingNode.belongsTo(models.SwcTracing, {foreignKey: "swcTracingId"});
    };

    return TracingNode;
}
