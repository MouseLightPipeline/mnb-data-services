import {DataTypes, Instance, Model, Models} from "sequelize";

import {createDuplicateWhereClause, isNullOrEmpty} from "./modelUtil";
import {IInjectionAttributes} from "./injection";

export interface IFluorophoreAttributes {
    id?: string;
    name?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IFluorophore extends Instance<IFluorophoreAttributes>, IFluorophoreAttributes {
    getInjections(): IInjectionAttributes[];
}

export interface IFluorophoreTable extends Model<IFluorophore, IFluorophoreAttributes> {
    duplicateWhereClause(name: string);
    findDuplicate(name: string): Promise<IFluorophore>;
    findOrCreateFromInput(fluorophoreInput: IFluorophoreAttributes): Promise<IFluorophore>;
    createFromInput(fluorophoreInput: IFluorophoreAttributes): Promise<IFluorophore>;
    updateFromInput(fluorophoreInput: IFluorophoreAttributes): Promise<IFluorophore>;
}

export const TableName = "Fluorophore";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): IFluorophoreTable {
    const Fluorophore: IFluorophoreTable = sequelize.define(TableName, {
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

    Fluorophore.associate = (models: Models) => {
        Fluorophore.hasMany(models.Injection, {foreignKey: "fluorophoreId", as: "injections"});
    };

    Fluorophore.duplicateWhereClause = (name: string) => {
        return createDuplicateWhereClause(sequelize, name);
    };

    Fluorophore.findDuplicate = async (name: string): Promise<IFluorophore> => {
        if (!name) {
            return null;
        }

        return Fluorophore.findOne(Fluorophore.duplicateWhereClause(name));
    };

    /**
     * Complex where clause to allow for case insensitive requires defaults property.  Wrapping for consistency as
     * a result.
     * @param {IFluorophoreAttributes} fluorophoreInput define name property
     **/
    Fluorophore.findOrCreateFromInput = async (fluorophoreInput: IFluorophoreAttributes): Promise<IFluorophore> => {
        const options = Fluorophore.duplicateWhereClause(fluorophoreInput.name);

        options["defaults"] = {name: fluorophoreInput.name};

        const [model] = await Fluorophore.findOrCreate(options);

        return model;
    };

    Fluorophore.createFromInput = async (fluorophoreInput: IFluorophoreAttributes): Promise<IFluorophore> => {
        if (!fluorophoreInput) {
            throw {message: "Fluorophore properties are a required input"};
        }

        if (!fluorophoreInput.name) {
            throw {message: "name is a required input"};
        }

        const duplicate = await Fluorophore.findDuplicate(fluorophoreInput.name);

        if (duplicate) {
            throw {message: `The name "${fluorophoreInput.name}" has already been used`};
        }

        return await Fluorophore.create({
            name: fluorophoreInput.name
        });
    };

    Fluorophore.updateFromInput = async (fluorophoreInput: IFluorophoreAttributes): Promise<IFluorophore> => {
        if (!fluorophoreInput) {
            throw {message: "Fluorophore properties are a required input"};
        }

        if (!fluorophoreInput.id) {
            throw {message: "Fluorophore input must contain the id of the object to update"};
        }

        let row = await Fluorophore.findById(fluorophoreInput.id);

        if (!row) {
            throw {message: "The fluorophore could not be found"};
        }

        // Undefined is ok - although strange as that is the only property at the moment.
        if (isNullOrEmpty(fluorophoreInput.name)) {
            throw {message: "name cannot be empty or null"};
        }

        const duplicate = await Fluorophore.findDuplicate(fluorophoreInput.name);

        if (duplicate && duplicate.id !== fluorophoreInput.id) {
            throw {message: `The name "${fluorophoreInput.name}" has already been used`};
        }

        await row.update(fluorophoreInput);

        return Fluorophore.findById(row.id);
    };

    return Fluorophore;
}
