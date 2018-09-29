import {Instance, Model, Models} from "sequelize";

import {IInjectionAttributes} from "./injection";
import {INeuronAttributes} from "./neuron";

export interface IBrainAreaAttributes {
    id: string;
    structureId?: number;
    depth?: number;
    name?: string;
    parentStructureId?: number;
    structureIdPath?: string;
    safeName?: string;
    acronym?: string;
    atlasId?: number;
    graphId?: number;
    graphOrder?: number;
    hemisphereId?: number;
    geometryFile?: string;
    geometryColor?: string;
    geometryEnable?: boolean;
    aliases?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBrainArea extends Instance<IBrainAreaAttributes>, IBrainAreaAttributes {
    getInjections(): IInjectionAttributes[];
    getNeurons(): INeuronAttributes[];
}

export interface IBrainAreaTable extends Model<IBrainArea, IBrainAreaAttributes> {
}

export const TableName = "BrainArea";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes): IBrainAreaTable {
    const BrainArea: IBrainAreaTable = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        structureId: DataTypes.INTEGER,
        depth: DataTypes.INTEGER,
        name: DataTypes.TEXT,
        parentStructureId: DataTypes.INTEGER,
        structureIdPath: DataTypes.TEXT,
        safeName: DataTypes.TEXT,
        acronym: DataTypes.TEXT,
        atlasId: DataTypes.INTEGER,
        graphId: DataTypes.INTEGER,
        graphOrder: DataTypes.INTEGER,
        hemisphereId: DataTypes.INTEGER,
        geometryFile: DataTypes.TEXT,
        geometryColor: DataTypes.TEXT,
        geometryEnable: DataTypes.BOOLEAN,
        aliases: DataTypes.TEXT
    }, {
        timestamps: true,
        paranoid: true
    });

    BrainArea.associate = (models: Models) => {
        BrainArea.hasMany(models.Injection, {foreignKey: "brainAreaId", as: "injections"});
        BrainArea.hasMany(models.Neuron, {foreignKey: "brainAreaId", as: "neurons"});
    };

    return BrainArea;
}

