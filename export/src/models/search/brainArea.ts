import {Sequelize, DataTypes} from "sequelize";

export const TableName = "BrainArea";

export function sequelizeImport(sequelize, DataTypes) {
    const BrainArea = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        structureId: DataTypes.INTEGER,
        depth: DataTypes.INTEGER,
        name: DataTypes.TEXT,
        parentStructureId: DataTypes.INTEGER,
        structureIdPath: DataTypes.TEXT,
        safeName: DataTypes.TEXT,
        acronym: DataTypes.TEXT,
        atlasId: DataTypes.INTEGER,
        graphId: DataTypes.INTEGER,
        graphOrder: DataTypes.INTEGER,
        hemisphereId: DataTypes.INTEGER,
        geometryFile: DataTypes.TEXT,
        geometryColor: DataTypes.TEXT,
        geometryEnable: DataTypes.BOOLEAN,
    }, {
        classMethods: {
            associate: (models: any) => {
                // BrainArea.hasMany(models.Neuron, {foreignKey: "brainAreaId", as: "neurons"});
            }
        },
        timestamps: false,
    });

    return BrainArea;
}
