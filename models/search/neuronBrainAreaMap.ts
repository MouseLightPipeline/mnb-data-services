export interface INeuronBrainMap {
    id: string;
    neuronId: string;
    tracingId: string;
    brainAreaId: string;
    neuronIdString: string;
    neuronDOI: string;
    nodeCount: number;
    somaCount: number;
    pathCount: number;
    branchCount: number;
    endCount: number;
}

export const TableName = "NeuronBrainAreaMap";

export function sequelizeImport(sequelize, DataTypes) {
    let NeuronBrainAreaMap = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID
        },
        neuronIdString: DataTypes.TEXT,
        neuronDOI: DataTypes.TEXT,
        somaX: DataTypes.DOUBLE,
        somaY: DataTypes.DOUBLE,
        somaZ: DataTypes.DOUBLE,
        nodeCount: DataTypes.INTEGER,
        somaCount: DataTypes.INTEGER,
        pathCount: DataTypes.INTEGER,
        branchCount: DataTypes.INTEGER,
        endCount: DataTypes.INTEGER
    }, {
        timestamps: false,
        tableName: TableName
    });

    NeuronBrainAreaMap.associate = models => {
        NeuronBrainAreaMap.belongsTo(models.Tracing, {foreignKey: "tracingId"});
        NeuronBrainAreaMap.belongsTo(models.BrainArea, {foreignKey: "brainAreaId"});
        NeuronBrainAreaMap.belongsTo(models.Neuron, {foreignKey: "neuronId"});
        NeuronBrainAreaMap.belongsTo(models.TracingStructure, {foreignKey: "tracingStructureId"});
    };

    return NeuronBrainAreaMap;
}
