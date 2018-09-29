export enum ExportFormat {
    SWC = 0,
    JSON = 1
}

export interface ITracing {
    id: string;
    neuronId: string;
    tracingStructureId: string;
    swcTracingId: string;
    nodeCount: number;
    pathCount: number;
    branchCount: number;
    endCount: number;
    transformedAt: Date;
}

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
        timestamps: true
    });

    Tracing.associate = models => {
        Tracing.hasMany(models.TracingNode, {foreignKey: "tracingId", as: "nodes"});
        Tracing.hasMany(models.NeuronBrainAreaMap, {foreignKey: "tracingId"});
        Tracing.belongsTo(models.Neuron, {foreignKey: "neuronId", as: "neuron"});
        Tracing.belongsTo(models.TracingStructure, {foreignKey: "tracingStructureId"});
    };

    return Tracing;
}
