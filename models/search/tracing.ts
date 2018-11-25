import {Instance, Model} from "sequelize";
import {ISearchTracingNode} from "./tracingNode";

export interface ISearchTracingAttributes {
    id: string;
    neuronId: string;
    tracingStructureId: string;
    somaId: string;
    nodeCount: number;
    pathCount: number;
    branchCount: number;
    endCount: number;
    transformedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}


export interface ISearchTracing extends Instance<ISearchTracingAttributes>, ISearchTracingAttributes {
    soma: ISearchTracingNode;
}

export interface ISearchTracingTable extends Model<ISearchTracing, ISearchTracingAttributes> {
}

export const TableName = "Tracing";

export function sequelizeImport(sequelize, DataTypes) {
    let Tracing = sequelize.define(TableName, {
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
        timestamps: true,
        freezeTableName: true
    });

    Tracing.associate = models => {
        Tracing.hasMany(models.TracingNode, {foreignKey: "tracingId", as: "nodes"});
        Tracing.hasMany(models.SearchContent, {foreignKey: "tracingId"});
        Tracing.belongsTo(models.Neuron, {foreignKey: "neuronId", as: "neuron"});
        Tracing.belongsTo(models.TracingStructure, {foreignKey: "tracingStructureId"});
        Tracing.belongsTo(models.TracingNode, {foreignKey: {name: "somaId", allowNull: true}, as: "soma"});
    };

    return Tracing;
}
