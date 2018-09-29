import {DataTypes, Instance, Model, Models} from "sequelize";

import {createDuplicateWhereClause, isNullOrEmpty} from "./modelUtil";
import {ISampleAttributes} from "./sample";

export interface IMouseStrainAttributes {
    id?: string;
    name?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IMouseStrain extends Instance<IMouseStrainAttributes>, IMouseStrainAttributes {
    getSamples(): ISampleAttributes[];
}

export interface IMouseStrainTable extends Model<IMouseStrain, IMouseStrainAttributes> {
    duplicateWhereClause(name: string);
    findDuplicate(name: string): Promise<IMouseStrain>;
    findOrCreateFromInput(mouseStrainInput: IMouseStrainAttributes): Promise<IMouseStrain>;
    createFromInput(mouseStrainInput: IMouseStrainAttributes): Promise<IMouseStrain>;
    updateFromInput(mouseStrainInput: IMouseStrainAttributes): Promise<IMouseStrain>;
}

export const TableName = "MouseStrain";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): IMouseStrainTable {
    const MouseStrain: IMouseStrainTable = sequelize.define(TableName, {
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

    MouseStrain.duplicateWhereClause = (name: string) => {
        return createDuplicateWhereClause(sequelize, name);
    };

    MouseStrain.findDuplicate = async (name: string): Promise<IMouseStrain> => {
        if (!name) {
            return null;
        }

        return MouseStrain.findOne(MouseStrain.duplicateWhereClause(name));
    };

    /**
     * Complex where clause to allow for case insensitive requires defaults property.  Wrapping for consistency as
     * a result.
     * @param {IMouseStrainAttributes} mouseStrainInput define name property
     **/
    MouseStrain.findOrCreateFromInput = async (mouseStrainInput: IMouseStrainAttributes): Promise<IMouseStrain> => {
        const options = MouseStrain.duplicateWhereClause(mouseStrainInput.name);

        options["defaults"] = {name: mouseStrainInput.name};

        const [model] = await MouseStrain.findOrCreate(options);

        return model;
    };

    MouseStrain.createFromInput = async (mouseStrainInput: IMouseStrainAttributes): Promise<IMouseStrain> => {
        if (!mouseStrainInput) {
            throw {message: "Mouse strain properties are a required input"};
        }

        if (!mouseStrainInput.name) {
            throw {message: "name is a required input"};
        }

        const duplicate = await MouseStrain.findDuplicate(mouseStrainInput.name);

        if (duplicate) {
            throw {message: `The name "${mouseStrainInput.name}" has already been used`};
        }

        return await MouseStrain.create({
            name: mouseStrainInput.name
        });
    };

    MouseStrain.updateFromInput = async (mouseStrainInput: IMouseStrainAttributes): Promise<IMouseStrain> => {
        if (!mouseStrainInput) {
            throw {message: "Mouse strain properties are a required input"};
        }

        if (!mouseStrainInput.id) {
            throw {message: "Mouse strain input must contain the id of the object to update"};
        }

        let row = await MouseStrain.findById(mouseStrainInput.id);

        if (!row) {
            throw {message: "The mouse strain could not be found"};
        }

        // Undefined is ok - although strange as that is the only property at the moment.
        if (isNullOrEmpty(mouseStrainInput.name)) {
            throw {message: "name cannot be empty or null"};
        }

        const duplicate = await MouseStrain.findDuplicate(mouseStrainInput.name);

        if (duplicate && duplicate.id !== mouseStrainInput.id) {
            throw {message: `The strain "${mouseStrainInput.name}" has already been created`};
        }

        await row.update(mouseStrainInput);

        return MouseStrain.findById(row.id);
    };

    return MouseStrain;
}
