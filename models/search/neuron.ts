import {Sequelize, DataTypes, Instance, Model} from "sequelize";

export enum SearchScope {
    Private = 0,
    Team = 1,
    Division = 2,
    Internal = 3,
    Moderated = 4,
    External = 5,
    Public = 6,
    Published
}

export interface ISearchNeuronAttributes {
    id: string;
    idString: string;
    tag: string;
    doi: string;
    keywords: string;
    x: number;
    y: number;
    z: number;
    brainAreaId: string;
    searchScope: SearchScope;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ISearchNeuron extends Instance<ISearchNeuronAttributes>, ISearchNeuronAttributes {
}

export interface ISearchNeuronTable extends Model<ISearchNeuron, ISearchNeuronAttributes> {
}

export const TableName = "Neuron";

export function sequelizeImport(sequelize: Sequelize, DataTypes: DataTypes): any {
    const Neuron = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        idString: DataTypes.TEXT,
        tag: DataTypes.TEXT,
        keywords: DataTypes.TEXT,
        x: DataTypes.DOUBLE,
        y: DataTypes.DOUBLE,
        z: DataTypes.DOUBLE,
        searchScope: DataTypes.INTEGER,
        doi: DataTypes.TEXT
    }, {
        timestamps: true,
        freezeTableName: true
    });

    Neuron.associate = (models: any) => {
        Neuron.belongsTo(models.BrainArea, {foreignKey: {name: "brainAreaId", allowNull: true}});
        Neuron.hasMany(models.SearchContent, {foreignKey: "neuronId"});
        Neuron.hasMany(models.Tracing, {foreignKey: "neuronId"});
        Neuron.belongsTo(models.Sample, {foreignKey: "sampleId"});
    };

    return Neuron;
}

