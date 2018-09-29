import {Sequelize, DataTypes} from "sequelize";

export interface INeuron {
    id: string;
    idString: string;
    tag: string;
    keywords: string;
    x: number;
    y: number;
    z: number;
    brainAreaId: string;
    sharing: number;
}

export const TableName = "Neuron";

export function sequelizeImport(sequelize: Sequelize, DataTypes: DataTypes): any {
    const Neuron: any = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
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
        timestamps: true
    });

    Neuron.associate = (models: any) => {
        Neuron.belongsTo(models.BrainArea, {foreignKey: {name: "brainAreaId", allowNull: true}});
        Neuron.hasMany(models.NeuronBrainAreaMap, {foreignKey: "neuronId"});
        Neuron.hasMany(models.Tracing, {foreignKey: "neuronId"});
    };

    return Neuron;
}

