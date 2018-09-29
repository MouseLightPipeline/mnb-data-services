import {DataTypes, Instance, Model, Models} from "sequelize";

import {ISampleAttributes, ISampleTable} from "./sample";

export interface ITransformAttributes {
    id?: string;
    location?: string;
    name?: string;
    notes?: string;
    sampleId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ITransform extends Instance<ITransformAttributes>, ITransformAttributes {
    getSample(): ISampleAttributes;
}

export interface ITransformTable extends Model<ITransform, ITransformAttributes> {
    SampleTable: ISampleTable;

    isDuplicate(transformInput: ITransformAttributes, id?: string): Promise<boolean>;
    createFromInput(transformInput: ITransformAttributes): Promise<ITransform>;
    updateFromInput(transformInput: ITransformAttributes): Promise<ITransform>;
    deleteFromInput(transformInput: ITransformAttributes): Promise<number>;
}

export const TableName = "RegistrationTransform";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): ITransformTable {
    const Transform: ITransformTable = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        location: DataTypes.TEXT,
        name: DataTypes.TEXT,
        notes: DataTypes.TEXT,
    }, {
        timestamps: true,
        paranoid: true
    });

    Transform.associate = (models: Models) => {
        Transform.belongsTo(models.Sample, {foreignKey: "sampleId", as: "sample"});

        Transform.SampleTable = models.Sample as ISampleTable;
    };

    Transform.SampleTable = null;

    Transform.isDuplicate = async (registrationTransform: ITransformAttributes, id: string = null): Promise<boolean> => {
        const dupes = await Transform.findAll({
            where: {
                sampleId: registrationTransform.sampleId,
                location: registrationTransform.location
            }
        });

        return dupes.length > 0 && (!id || (id !== dupes[0].id));
    };

    Transform.createFromInput = async (registrationTransform: ITransformAttributes): Promise<ITransform> => {
        if (!registrationTransform.location || registrationTransform.location.length === 0) {
            throw {message: "location is a required input"};
        }

        if (await Transform.isDuplicate(registrationTransform)) {
            throw {message: `The location "${registrationTransform.location}" already exists for this sample`};
        }

        const sample = await Transform.SampleTable.findById(registrationTransform.sampleId);

        if (!sample) {
            throw {message: "the sample can not be found"};
        }

        return await Transform.create({
            location: registrationTransform.location,
            name: registrationTransform.name || "",
            notes: registrationTransform.notes || "",
            sampleId: registrationTransform.sampleId
        });
    };

    Transform.updateFromInput = async (registrationTransform: ITransformAttributes): Promise<ITransform> => {
        let row: ITransform = await Transform.findById(registrationTransform.id);

        if (!row) {
            throw {message: "The registration transform could not be found"};
        }

        if (registrationTransform.location && await Transform.isDuplicate(registrationTransform, registrationTransform.id)) {
            throw {row, message: `The name "${registrationTransform.location}" has already been used`};
        }

        // Undefined is ok (no update) - null, or empty is not.
        if (registrationTransform.location !== undefined && (registrationTransform.location != null || (registrationTransform.location.length === 0))) {
            throw {row, message: "Location cannot be empty"};
        }

        // Same as above, but also must be existing sample
        if (registrationTransform.sampleId === null) {
            throw {row, message: "Sample id cannot be empty"};
        }

        if (registrationTransform.sampleId) {
            if (registrationTransform.location !== undefined && registrationTransform.location.length === 0) {
                throw {row, message: "Sample id cannot be empty"};
            }

            const sample = await Transform.SampleTable.findById(registrationTransform.sampleId);

            if (!sample) {
                throw {row, message: "The sample can not be found"};
            }
        }

        // Undefined is ok (no update) - but prefer not null
        if (registrationTransform.name === null) {
            registrationTransform.name = "";
        }

        if (registrationTransform.notes === null) {
            registrationTransform.notes = "";
        }

        await row.update(registrationTransform);

        return Transform.findById(row.id);
    };

    Transform.deleteFromInput = async (registrationTransform: ITransformAttributes): Promise<number> => {
        // Note - there is nothing here to prevent dangling transformed tracings.  Caller assumes responsibility to
        // enforce relationships across database boundaries.
        if (!registrationTransform.id || registrationTransform.id.length === 0) {
            throw {message: "id is a required input"};
        }

        return await Transform.destroy({where: {id: registrationTransform.id}});
    };

    return Transform;
}
