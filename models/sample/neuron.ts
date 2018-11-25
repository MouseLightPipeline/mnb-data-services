import {DataTypes, Instance, Model, Models} from "sequelize";

import {IInjection, IInjectionTable} from "./injection";
import {IBrainArea, IBrainAreaTable} from "./brainArea";
import {ISampleTable} from "./sample";

export interface INeuronAttributes {
    id: string;
    idNumber: number;
    idString: string;
    tag: string;
    keywords: string;
    x: number;
    y: number;
    z: number;
    doi: string;
    sharing: number;
    brainAreaId: string;
    injectionId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface INeuron extends Instance<INeuronAttributes>, INeuronAttributes {
    injection: IInjection;
    brainArea: IBrainArea;
}

export interface INeuronTable extends Model<INeuron, INeuronAttributes> {
    BrainAreaTable: IBrainAreaTable;
    InjectionTable: IInjectionTable;
    SampleTable: ISampleTable;
}

export const TableName = "Neuron";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): INeuronTable {
    const Neuron: INeuronTable = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        idNumber: {
            type: DataTypes.INTEGER,
            defaultValue: -1
        },
        idString: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        tag: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        keywords: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        x: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        y: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        z: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        sharing: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        doi: {
            type: DataTypes.TEXT
        }
    }, {
        timestamps: true,
        paranoid: true
    });

    Neuron.BrainAreaTable = null;
    Neuron.InjectionTable = null;
    Neuron.SampleTable = null;

    Neuron.associate = (models: Models): void => {
        Neuron.belongsTo(models.Injection, {foreignKey: "injectionId", as: "injection"});
        Neuron.belongsTo(models.BrainArea, {
            foreignKey: {name: "brainAreaId", allowNull: true},
            as: "brainArea"
        });

        Neuron.BrainAreaTable = models.BrainArea as IBrainAreaTable;
        Neuron.InjectionTable = models.Injection as IInjectionTable;
        Neuron.SampleTable = models.Sample as ISampleTable;
    };

    return Neuron;
}
