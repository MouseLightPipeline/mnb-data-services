import {DataTypes, Instance, Model, Models} from "sequelize";

import {ISearchMouseStrainAttributes, ISearchMouseStrainTable} from "./mouseStrain";

export interface ISearchSampleAttributes {
    id?: string,
    idNumber?: number;
    animalId?: string;
    tag?: string;
    comment?: string;
    sampleDate?: Date;
    mouseStrainId?: string;
    searchScope?: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export interface ISearchSample extends Instance<ISearchSampleAttributes>, ISearchSampleAttributes {
    getMouseStrain(): ISearchMouseStrainAttributes;
}

export interface ISearchSampleTable extends Model<ISearchSample, ISearchSampleAttributes> {
    MouseStrainTable: ISearchMouseStrainTable;
}

export const TableName = "Sample";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): ISearchSampleTable {
    const Sample: ISearchSampleTable = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        idNumber: {
            type: DataTypes.INTEGER,
            defaultValue: -1
        },
        animalId: DataTypes.TEXT,
        tag: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        comment: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        searchScope: DataTypes.INTEGER
    }, {
        timestamps: true,
        paranoid: true
    });

    Sample.associate = (models: Models) => {
        Sample.belongsTo(models.MouseStrain, {foreignKey: "mouseStrainId", as: "mouseStrain"});

        Sample.MouseStrainTable = models.MouseStrain as ISearchMouseStrainTable;
    };

    Sample.MouseStrainTable = null;

    return Sample;
}
