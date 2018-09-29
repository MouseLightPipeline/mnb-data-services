import {DataTypes, Instance, Model, Models} from "sequelize";

import {isNullOrEmpty} from "./modelUtil";
import {INeuronAttributes} from "./neuron";
import {IFluorophoreAttributes, IFluorophoreTable} from "./fluorophore";
import {IInjectionVirusAttributes, IInjectionVirusTable} from "./injectionVirus";
import {IBrainAreaAttributes} from "./brainArea";
import {ISampleAttributes} from "./sample";

export interface IInjectionInput {
    id: string;
    brainAreaId?: string;
    injectionVirusId?: string;
    injectionVirusName?: string;
    fluorophoreId?: string;
    fluorophoreName?: string;
    sampleId?: string;
}

export interface IInjectionAttributes {
    id?: string;
    brainAreaId?: string;
    injectionVirusId?: string;
    fluorophoreId?: string;
    sampleId?: string;
    createdAt?: Date;
    updatedAt?: Date;

    getSample?(): ISampleAttributes;
    getBrainArea?(): IBrainAreaAttributes;
    getInjectionVirus?(): IInjectionVirusAttributes;
    getFluorophore?(): IFluorophoreAttributes;
    getNeurons?(): INeuronAttributes[];
}

export interface IInjection extends Instance<IInjectionAttributes>, IInjectionAttributes {
    getSamples(): ISampleAttributes[];
}

export interface IInjectionTable extends Model<IInjection, IInjectionAttributes> {
    InjectionVirusTable: IInjectionVirusTable;
    FluorophoreTable: IFluorophoreTable;

    findDuplicate(injectionInput: IInjectionAttributes): Promise<IInjection>;
    createFromInput(injectionInput: IInjectionInput): Promise<IInjection>;
    updateFromInput(injectionInput: IInjectionAttributes): Promise<IInjection>;
    deleteFromInput(injectionInput: IInjectionAttributes): Promise<number>;
}

export const TableName = "Injection";

// noinspection JSUnusedGlobalSymbols
export function sequelizeImport(sequelize, DataTypes: DataTypes): IInjectionTable {
    const Injection: IInjectionTable = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
    }, {
        timestamps: true,
        paranoid: true
    });

    Injection.InjectionVirusTable = null;
    Injection.FluorophoreTable = null;

    Injection.associate = (models: Models) => {
        Injection.belongsTo(models.Sample, {foreignKey: "sampleId", as: "sample"});
        Injection.belongsTo(models.BrainArea, {foreignKey: "brainAreaId", as: "brainArea"});
        Injection.belongsTo(models.InjectionVirus, {foreignKey: "injectionVirusId", as: "injectionVirus"});
        Injection.belongsTo(models.Fluorophore, {foreignKey: "fluorophoreId", as: "fluorophore"});
        Injection.hasMany(models.Neuron, {foreignKey: "injectionId", as: "neurons"});

        Injection.InjectionVirusTable = models.InjectionVirus as IInjectionVirusTable;
        Injection.FluorophoreTable = models.Fluorophore as IFluorophoreTable;
    };

    /**
     * A given sample can have one injection per brain area/compartment.
     * @param injectionInput
     * @returns {Promise<IFluorophoreAttributes>}
     */
    Injection.findDuplicate = async (injectionInput: IInjectionAttributes): Promise<IInjection> => {
        if (!injectionInput || !injectionInput.sampleId || !injectionInput.brainAreaId) {
            return null;
        }

        return Injection.findOne({
            where: {
                sampleId: injectionInput.sampleId,
                brainAreaId: injectionInput.brainAreaId
            }
        });
    };

    Injection.createFromInput = async (injectionInput: IInjectionInput): Promise<IInjection> => {
        if (!injectionInput) {
            throw {message: "Injection properties are a required input"};
        }

        if (!injectionInput.sampleId) {
            throw {message: "Sample is a required input"};
        }

        if (!injectionInput.brainAreaId) {
            throw {message: "Brain area is a required input"};
        }

        // Not enforcing any duplicate rules for injections at the moment.
        /*
         const duplicate = await Injection.findDuplicate(injectionInput);

         if (duplicate) {
         throw {message: `An injection for this sample in this brain compartment exists`};
         }
         */
        let injectionVirusId = null;

        if (injectionInput.injectionVirusName) {
            const out = await Injection.InjectionVirusTable.findOrCreateFromInput({
                name: injectionInput.injectionVirusName
            });

            injectionVirusId = out.id;
        } else {
            injectionVirusId = injectionInput.injectionVirusId;
        }

        if (!injectionVirusId) {
            throw {message: "Injection virus is a required input"};
        }

        let fluorophoreId = null;

        if (injectionInput.fluorophoreName) {
            const out = await Injection.FluorophoreTable.findOrCreateFromInput({
                name: injectionInput.fluorophoreName
            });

            fluorophoreId = out.id;
        } else {
            fluorophoreId = injectionInput.fluorophoreId;
        }

        if (!fluorophoreId) {
            throw {message: "Fluorophore is a required input"};
        }

        return await Injection.create({
            sampleId: injectionInput.sampleId,
            brainAreaId: injectionInput.brainAreaId,
            injectionVirusId: injectionVirusId,
            fluorophoreId: fluorophoreId
        });
    };

    Injection.updateFromInput = async (injectionInput: IInjectionInput): Promise<IInjection> => {
        if (!injectionInput) {
            throw {message: "Injection properties are a required input"};
        }

        if (!injectionInput.id) {
            throw {message: "Injection input must contain the id of the object to update"};
        }

        let row = await Injection.findById(injectionInput.id);

        if (!row) {
            throw {message: "The injection could not be found"};
        }

        // Undefined is ok (i.e., no update), null/empty is not allowed
        if (isNullOrEmpty(injectionInput.sampleId)) {
            throw {message: "Sample id must be a valid sample"};
        }

        if (isNullOrEmpty(injectionInput.brainAreaId)) {
            throw {message: "Brain compartment id must be a valid sample"};
        }

        if (isNullOrEmpty(injectionInput.injectionVirusId)) {
            throw {message: "Injection virus id must be a valid sample"};
        }

        if (isNullOrEmpty(injectionInput.fluorophoreId)) {
            throw {message: "Fluorophore id must be a valid sample"};
        }

        const merged = Object.assign(row, injectionInput);

        const duplicate = await Injection.findDuplicate(merged);

        if (duplicate && duplicate.id !== injectionInput.id) {
            throw {message: `This sample already contains an injection in this brain compartment`};
        }

        if (injectionInput.injectionVirusName) {
            const out = await Injection.InjectionVirusTable.findOrCreateFromInput({
                name: injectionInput.injectionVirusName
            });

            injectionInput.injectionVirusId = out.id;
        }

        if (injectionInput.fluorophoreName) {
            const out = await Injection.FluorophoreTable.findOrCreateFromInput({
                name: injectionInput.fluorophoreName
            });

            injectionInput.fluorophoreId = out.id;
        }

        await row.update(injectionInput);

        return Injection.findById(row.id);
    };

    Injection.deleteFromInput = async (injectionInput: IInjectionAttributes): Promise<number> => {
        // Note - there is nothing here to prevent dangling transformed tracings.  Caller assumes responsibility to
        // enforce relationships across database boundaries.
        if (!injectionInput.id) {
            throw {message: "The injection id is a required input"};
        }

        return await Injection.destroy({where: {id: injectionInput.id}});
    };

    return Injection;
}
