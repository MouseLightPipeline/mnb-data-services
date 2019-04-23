import {DataTypes, Instance, Model, Models} from "sequelize";

import {ISearchSampleAttributes} from "./sample";

export interface ISearchMouseStrainAttributes {
    id?: string;
    name?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ISearchMouseStrain extends Instance<ISearchMouseStrainAttributes>, ISearchMouseStrainAttributes {
    getSamples(): ISearchSampleAttributes[];
}

export interface ISearchMouseStrainTable extends Model<ISearchMouseStrain, ISearchMouseStrainAttributes> {
}

export const TableName = "MouseStrain";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): ISearchMouseStrainTable {
    const MouseStrain: ISearchMouseStrainTable = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.TEXT
    }, {
        timestamps: true,
        paranoid: true
    });

    MouseStrain.associate = (models: Models) => {
        MouseStrain.hasMany(models.Sample, {foreignKey: "mouseStrainId", as: "samples"});
    };

    return MouseStrain;
}
