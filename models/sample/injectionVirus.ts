import {DataTypes, Instance, Model, Models} from "sequelize";

import {IInjectionAttributes} from "./injection";
import {createDuplicateWhereClause, isNullOrEmpty} from "./modelUtil";

export interface IInjectionVirusAttributes {
    id?: string;
    name?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IInjectionVirus extends Instance<IInjectionVirusAttributes>, IInjectionVirusAttributes {
    getInjections(): IInjectionAttributes[];
}

export interface IInjectionVirusTable extends Model<IInjectionVirus, IInjectionVirusAttributes> {
    duplicateWhereClause(name: string);
    findDuplicate(name: string): Promise<IInjectionVirus>;
    findOrCreateFromInput(virusInput: IInjectionVirusAttributes): Promise<IInjectionVirus>;
    createFromInput(virusInput: IInjectionVirusAttributes): Promise<IInjectionVirus>;
    updateFromInput(virusInput: IInjectionVirusAttributes): Promise<IInjectionVirus>;
}

export const TableName = "InjectionVirus";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): IInjectionVirusTable {
    const InjectionVirus: IInjectionVirusTable = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.TEXT
    }, {
        tableName: "InjectionViruses",
        timestamps: true,
        paranoid: true
    });

    InjectionVirus.associate = (models: Models) => {
        InjectionVirus.hasMany(models.Injection, {foreignKey: "injectionVirusId", as: "injections"});
    };

    InjectionVirus.duplicateWhereClause = (name: string) => {
        return createDuplicateWhereClause(sequelize, name);
    };

    InjectionVirus.findDuplicate = async (name: string): Promise<IInjectionVirus> => {
        if (!name) {
            return null;
        }

        return InjectionVirus.findOne(InjectionVirus.duplicateWhereClause(name));
    };

    /**
     * Complex where clause to allow for case insensitive requires defaults property.  Wrapping for consistency as
     * a result.
     * @param {IInjectionVirusAttributes} fluorophore define name property
     **/
    InjectionVirus.findOrCreateFromInput = async (virusInput: IInjectionVirusAttributes): Promise<IInjectionVirus> => {
        const options = InjectionVirus.duplicateWhereClause(virusInput.name);

        options["defaults"] = {name: virusInput.name};

        const [model] = await InjectionVirus.findOrCreate(options);

        return model;
    };

    InjectionVirus.createFromInput = async (virusInput: IInjectionVirusAttributes): Promise<IInjectionVirus> => {
        if (!virusInput) {
            throw {message: "Injection virus properties are a required input"};
        }

        if (!virusInput.name) {
            throw {message: "name is a required input"};
        }

        const duplicate = await InjectionVirus.findDuplicate(virusInput.name);

        if (duplicate) {
            throw {message: `The name "${virusInput.name}" has already been used`};
        }

        return await InjectionVirus.create({
            name: virusInput.name
        });
    };

    InjectionVirus.updateFromInput = async (virusInput: IInjectionVirusAttributes): Promise<IInjectionVirus> => {
        if (!virusInput) {
            throw {message: "Injection virus properties are a required input"};
        }

        if (!virusInput.id) {
            throw {message: "Virus input must contain the id of the object to update"};
        }

        let row = await InjectionVirus.findById(virusInput.id);

        if (!row) {
            throw {message: "The injection virus could not be found"};
        }

        // Undefined is ok - although strange as that is the only property at the moment.
        if (isNullOrEmpty(virusInput.name)) {
            throw {message: "name cannot be empty"};
        }

        const duplicate = await InjectionVirus.findDuplicate(virusInput.name);

        if (duplicate && duplicate.id !== virusInput.id) {
            throw {message: `The name "${virusInput.name}" has already been used`};
        }

        await row.update(virusInput);

        return InjectionVirus.findById(row.id);
    };

    return InjectionVirus;
}
