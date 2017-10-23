export const TableName = "Tracing";

export function sequelizeImport(sequelize, DataTypes) {
    let Tracing = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        swcTracingId: DataTypes.UUID,
        nodeCount: DataTypes.INTEGER,
        pathCount: DataTypes.INTEGER,
        branchCount: DataTypes.INTEGER,
        endCount: DataTypes.INTEGER,
        transformedAt: DataTypes.DATE
    }, {
        classMethods: {
            associate: models => {
                Tracing.hasMany(models.TracingNode, {foreignKey: "tracingId", as: "nodes"});
                Tracing.hasMany(models.NeuronBrainAreaMap, {foreignKey: "tracingId"});
                Tracing.belongsTo(models.Neuron, {foreignKey: "neuronId"});
                Tracing.belongsTo(models.TracingStructure, {foreignKey: "tracingStructureId"});
            }
        },
        timestamps: false
    });

    return Tracing;
}
