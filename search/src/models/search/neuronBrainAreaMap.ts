export const TableName = "NeuronBrainAreaMap";

export function sequelizeImport(sequelize, DataTypes) {
    let NeuronBrainAreaMap = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID
        },
        somaX: DataTypes.DOUBLE,
        somaY: DataTypes.DOUBLE,
        somaZ: DataTypes.DOUBLE,
        nodeCount: DataTypes.INTEGER,
        somaCount: DataTypes.INTEGER,
        pathCount: DataTypes.INTEGER,
        branchCount: DataTypes.INTEGER,
        endCount: DataTypes.INTEGER
    }, {
        classMethods: {
            associate: models => {
                NeuronBrainAreaMap.belongsTo(models.Tracing, {foreignKey: "tracingId"});
                NeuronBrainAreaMap.belongsTo(models.BrainArea, {foreignKey: "brainAreaId"});
                NeuronBrainAreaMap.belongsTo(models.Neuron, {foreignKey: "neuronId"});
                NeuronBrainAreaMap.belongsTo(models.TracingStructure, {foreignKey: "tracingStructureId"});
            }
        },
        timestamps: false,
        tableName: TableName
    });

    return NeuronBrainAreaMap;
}
