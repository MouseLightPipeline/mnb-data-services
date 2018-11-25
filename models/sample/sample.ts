import {DataTypes, Instance, Model, Models} from "sequelize";

import {IInjectionAttributes} from "./injection";
import {ITransformAttributes} from "./registrationTransform";
import {IMouseStrainAttributes, IMouseStrainTable} from "./mouseStrain";

export interface ISampleInput {
    id: string,
    idNumber?: number;
    animalId?: string;
    tag?: string;
    comment?: string;
    sampleDate?: number;
    mouseStrainId?: string;
    mouseStrainName?: string;
    activeRegistrationTransformId: string;
    sharing?: number;
}

export interface ISampleAttributes {
    id?: string,
    idNumber?: number;
    animalId?: string;
    tag?: string;
    comment?: string;
    sampleDate?: Date;
    mouseStrainId?: string;
    activeRegistrationTransformId?: string;
    sharing?: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export interface ISample extends Instance<ISampleAttributes>, ISampleAttributes {
    getInjections(): IInjectionAttributes[];
    getRegistrationTransforms(): ITransformAttributes[];
    getMouseStrain(): IMouseStrainAttributes;
}

export interface ISampleTable extends Model<ISample, ISampleAttributes> {
    MouseStrainTable: IMouseStrainTable;

    isDuplicate(sampleInput: ISampleInput, id?: string): Promise<boolean>;
    createFromInput(sampleInput: ISampleInput): Promise<ISample>;
    updateFromInput(sampleInput: ISampleInput): Promise<ISample>;
    deleteFromInput(sampleInput: ISampleInput): Promise<number>;
}

export const TableName = "Sample";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): ISampleTable {
    const Sample: ISampleTable = sequelize.define(TableName, {
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
        sampleDate: DataTypes.DATE,
        activeRegistrationTransformId: {
            type: DataTypes.TEXT,
            defaultValue: "",
        },
        sharing: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        timestamps: true,
        paranoid: true
    });

    Sample.associate = (models: Models) => {
        Sample.hasMany(models.Injection, {foreignKey: "sampleId", as: "injections"});
        Sample.hasMany(models.RegistrationTransform, {
            foreignKey: "sampleId",
            as: "registrationTransforms"
        });
        Sample.belongsTo(models.MouseStrain, {foreignKey: "mouseStrainId", as: "mouseStrain"});

        Sample.MouseStrainTable = models.MouseStrain as IMouseStrainTable;
    };

    Sample.MouseStrainTable = null;

    Sample.isDuplicate = async (sampleInput: ISampleInput, id: string = null): Promise<boolean> => {
        const dupes = await Sample.findAll({where: {idNumber: sampleInput.idNumber}});

        return dupes.length > 0 && (!id || (id !== dupes[0].id));
    };

    Sample.createFromInput = async (sampleInput: ISampleInput): Promise<ISample> => {
        if (sampleInput === undefined || sampleInput === null) {
            throw {message: "Sample input object is required"};
        }

        let idNumber = sampleInput.idNumber;

        if (idNumber === undefined || idNumber === null) {
            const existing = await Sample.findAll({
                attributes: ["idNumber"],
                order: [["idNumber", "DESC"]],
                limit: 1
            }).map((o: ISampleAttributes) => o.idNumber);

            if (existing.length > 0) {
                idNumber = existing[0] + 1;
            } else {
                idNumber = 1;
            }
        } else if (await Sample.isDuplicate(sampleInput)) {
            throw {message: `The id number ${sampleInput.idNumber} has already been used`};
        }

        const sampleDate = sampleInput.sampleDate ? new Date(sampleInput.sampleDate) : new Date();
        const animalId = sampleInput.animalId || "";
        const tag = sampleInput.tag || "";
        const comment = sampleInput.comment || "";
        const activeRegistrationTransformId = sampleInput.activeRegistrationTransformId || null;
        const mouseStrainId = sampleInput.mouseStrainId || null;
        const sharing = sampleInput.sharing || 0;

        return await Sample.create({
            idNumber: idNumber,
            sampleDate: sampleDate,
            animalId: animalId,
            tag: tag,
            comment: comment,
            sharing: sharing,
            activeRegistrationTransformId: activeRegistrationTransformId,
            mouseStrainId: mouseStrainId
        });
    };

    Sample.updateFromInput = async (sampleInput: ISampleInput): Promise<ISample> => {
        // Ok to be undefined (and not updated) - not ok to be null
        if ((sampleInput.idNumber === null) || sampleInput.idNumber && isNaN(sampleInput.idNumber)) {
            throw {message: `The id number can not be empty`};
        }

        let row = await Sample.findById(sampleInput.id);

        if (!row) {
            throw {message: "The sample could not be found"};
        }

        if (sampleInput.idNumber && await Sample.isDuplicate(sampleInput, sampleInput.id)) {
            throw {message: `The id number ${sampleInput.idNumber} has already been used`};
        }

        // Ok to be undefined (and not updated) - not ok to be null
        if (sampleInput.animalId === null) {
            sampleInput.animalId = "";
        }

        if (sampleInput.tag === null) {
            sampleInput.tag = "";
        }

        if (sampleInput.comment === null) {
            sampleInput.comment = "";
        }

        if (sampleInput.sharing === null) {
            sampleInput.sharing = 0;
        }

        // Ok to be null.
        if (sampleInput.mouseStrainName) {
            const out = await Sample.MouseStrainTable.findOrCreateFromInput({
                name: sampleInput.mouseStrainName
            });

            sampleInput.mouseStrainId = out.id;
        } else if (sampleInput.mouseStrainName === null) {
            sampleInput.mouseStrainName = null;
        }

        await row.update(sampleInput);

        return Sample.findById(row.id);
    };

    Sample.deleteFromInput = async (sampleInput: ISampleInput): Promise<number> => {
        if (!sampleInput.id) {
            throw {message: "The sample id is a required input"};
        }

        return await Sample.destroy({where: {id: sampleInput.id}});
    };

    return Sample;
}
