import {Sequelize, DataTypes} from "sequelize";

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
        classMethods: {
            associate: (models: any) => {
                Neuron.belongsTo(models.BrainArea, {
                    foreignKey: {name: "brainAreaId", allowNull: true},
                    as: "brainArea"
                });
                Neuron.hasMany(models.Tracing, {foreignKey: "neuronId"});
                Neuron.hasMany(models.NeuronBrainAreaMap, {foreignKey: "neuronId"});
            }
        },
        timestamps: false,
    });


    return Neuron;
}

