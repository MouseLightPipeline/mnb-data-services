import {DataTypes, Instance, Model, Models} from "sequelize";

import {IInjectionAttributes, IInjectionTable} from "./injection";
import {IBrainAreaAttributes, IBrainAreaTable} from "./brainArea";
import {isNullOrEmpty} from "./modelUtil";
import {ISampleTable} from "./sample";
import * as Seq from "sequelize";

export interface INeuronAttributes {
    id?: string;
    idNumber?: number;
    idString?: string;
    tag?: string;
    keywords?: string;
    x?: number;
    y?: number;
    z?: number;
    doi?: string;
    sharing?: number;
    brainAreaId?: string;
    injectionId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface INeuron extends Instance<INeuronAttributes>, INeuronAttributes {
    getInjection(): IInjectionAttributes;
    getBrainArea(): IBrainAreaAttributes;
}

export interface INeuronTable extends Model<INeuron, INeuronAttributes> {
    BrainAreaTable: IBrainAreaTable;
    InjectionTable: IInjectionTable;
    SampleTable: ISampleTable;

    isDuplicate(idString: string, injectionId: string, id?: string): Promise<boolean>;
    isDuplicateNeuronObj(neuron: INeuronAttributes): Promise<boolean>
    createFromInput(neuron: INeuronAttributes): Promise<INeuron>;
    updateFromInput(neuron: INeuronAttributes): Promise<INeuron>;
    deleteFromInput(neuron: INeuronAttributes): Promise<number>;
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

    Neuron.isDuplicate = async (idString: string, injectionId: string, id: string = null): Promise<boolean> => {
        if (!injectionId || !idString) {
            return false;
        }

        const injection = await Neuron.InjectionTable.findById(injectionId);

        if (!injection) {
            return false;
        }

        const sample = await Neuron.SampleTable.findById(injection.sampleId);

        if (!sample) {
            return false;
        }

        // Now get all injections for this sample.
        const injectionIds = await Neuron.InjectionTable.findAll({where: {sampleId: sample.id}}).map((i: IInjectionAttributes) => i.id);

        if (injectionIds.length === 0) {
            return false;
        }

        // All neurons for sample (via injections) that have the same idString
        const dupes = await Neuron.findAll({where: {injectionId: {[Seq.Op.in]: injectionIds}, idString}});

        return dupes.length > 0 && (!id || (id !== dupes[0].id));
    };

    Neuron.isDuplicateNeuronObj = async (neuron: INeuronAttributes): Promise<boolean> => {
        return Neuron.isDuplicate(neuron.idString, neuron.injectionId, neuron.id);
    };

    Neuron.createFromInput = async (neuron: INeuronAttributes): Promise<INeuron> => {
        const injection = await Neuron.InjectionTable.findById(neuron.injectionId);

        if (!injection) {
            throw {message: "the injection can not be found"};
        }

        if (neuron.brainAreaId) {
            const brainArea = await Neuron.BrainAreaTable.findById(neuron.brainAreaId);

            if (!brainArea) {
                throw {message: "the brain area can not be found"};
            }
        } else if (neuron.brainAreaId !== null) {
            // Zero-length string or undefined
            neuron.brainAreaId = null;
        }

        if (await Neuron.isDuplicateNeuronObj(neuron)) {
            throw {message: `a neuron id "${neuron.idString}" already exists on this sample`};
        }

        return await Neuron.create({
            idNumber: neuron.idNumber || 0,
            idString: neuron.idString || "",
            tag: neuron.tag || "",
            keywords: neuron.keywords || "",
            x: neuron.x || 0,
            y: neuron.y || 0,
            z: neuron.z || 0,
            sharing: 1,
            brainAreaId: neuron.brainAreaId,
            injectionId: neuron.injectionId
        });
    };

    Neuron.updateFromInput = async (neuron: INeuronAttributes): Promise<INeuron> => {
        let row = await Neuron.findById(neuron.id);

        if (!row) {
            throw {message: "The neuron could not be found"};
        }

        const isDupe = await Neuron.isDuplicate(neuron.idString || row.idString, neuron.injectionId || row.injectionId, row.id);

        if (isDupe) {
            throw {message: `A neuron id "${neuron.idString}" already exists on this sample`};
        }

        // Undefined is ok (no update) - null, or empty is not - unless it is already that way from create
        if (isNullOrEmpty(neuron.idString) && row.idString) {
            throw {message: "idString cannot be empty"};
        }

        if (isNullOrEmpty(neuron.injectionId)) {
            throw {message: "injection id cannot be empty"};
        }

        if (neuron.injectionId) {
            const injection = await Neuron.InjectionTable.findById(neuron.injectionId);

            if (!injection) {
                throw {message: "the injection can not be found"};
            }
        }

        // Null is ok (inherited),  Undefined is ok (no change).  Id of length zero treated as null.  Otherwise must
        // find brain area.
        if (neuron.brainAreaId) {
            const brainArea = await Neuron.BrainAreaTable.findById(neuron.brainAreaId);

            if (!brainArea) {
                throw {message: "the brain area can not be found"};
            }
        } else if (neuron.brainAreaId !== undefined && neuron.brainAreaId !== null) {
            // Zero-length string
            neuron.brainAreaId = null;
        }

        // Undefined is ok (no update) - but prefer not null
        if (neuron.tag === null) {
            neuron.tag = "";
        }

        if (neuron.keywords === null) {
            neuron.keywords = "";
        }

        if (neuron.idNumber === null) {
            neuron.idNumber = 0;
        }

        if (neuron.x === null) {
            neuron.x = 0;
        }

        if (neuron.y === null) {
            neuron.y = 0;
        }

        if (neuron.z === null) {
            neuron.z = 0;
        }

        if (neuron.sharing === null) {
            neuron.sharing = 1;
        }

        await row.update(neuron);

        return Neuron.findById(row.id);
    };

    Neuron.deleteFromInput = async (neuron: INeuronAttributes): Promise<number> => {
        // Note - there is nothing here to prevent dangling swc tracings.  Caller assumes responsibility to
        // enforce relationships across database boundaries.
        if (!neuron.id) {
            throw {message: "The neuron id is a required input"};
        }

        return await Neuron.destroy({where: {id: neuron.id}});
    };

    return Neuron;
}
