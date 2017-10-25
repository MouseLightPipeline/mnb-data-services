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
        classMethods: {
            associate: models => {
                TracingNode.belongsTo(models.Tracing, {foreignKey: "tracingId"});
                TracingNode.belongsTo(models.StructureIdentifier, {foreignKey: "structureIdentifierId"});
                TracingNode.belongsTo(models.BrainArea, {foreignKey: "brainAreaId"});
            }
        },
        timestamps: false,
    });

    return TracingNode;
}
