import {Sequelize, DataTypes} from "sequelize";

export interface IBrainArea {
    id: string;
    structureId: number;
    depth: number;
    name: string;
    parentStructureId: number;
    structureIdPath: string;
    safeName: string;
    acronym: string;
    atlasId: number;
    graphId: number;
    graphOrder: number;
    hemisphereId: number;
    geometryFile: string;
    geometryColor: string;
    geometryEnable: boolean;
}

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
        timestamps: false,
    });

    BrainArea.associate = (models: any) => {
        BrainArea.hasMany(models.Neuron, {foreignKey: "brainAreaId", as: "neurons"});
    };

    return BrainArea;
}
