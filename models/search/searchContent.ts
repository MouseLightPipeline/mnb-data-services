import {Instance, Model} from "sequelize";
import {SearchScope} from "./neuron";

export interface ISearchContentAttributes {
    id: string;
    searchScope: SearchScope;
    neuronId: string;
    tracingId: string;
    tracingStructureId: string;
    brainAreaId: string;
    neuronIdString: string;
    neuronDOI: string;
    somaX: number;
    somaY: number;
    somaZ: number;
    nodeCount: number;
    somaCount: number;
    pathCount: number;
    branchCount: number;
    endCount: number;
}

export interface ISearchContent extends Instance<ISearchContentAttributes>, ISearchContentAttributes {
}

export interface ISearchContentTable extends Model<ISearchContent, ISearchContentAttributes> {
}

export const TableName = "SearchContent";

export function sequelizeImport(sequelize, DataTypes) {
    let SearchContent = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID
        },
        searchScope: DataTypes.INTEGER,
        neuronIdString: DataTypes.TEXT,
        neuronDOI: DataTypes.TEXT,
        somaX: DataTypes.DOUBLE,
        somaY: DataTypes.DOUBLE,
        somaZ: DataTypes.DOUBLE,
        nodeCount: DataTypes.INTEGER,
        somaCount: DataTypes.INTEGER,
        pathCount: DataTypes.INTEGER,
        branchCount: DataTypes.INTEGER,
        endCount: DataTypes.INTEGER
    }, {
        timestamps: false,
        freezeTableName: true
    });

    SearchContent.associate = models => {
        SearchContent.belongsTo(models.Tracing, {foreignKey: "tracingId"});
        SearchContent.belongsTo(models.BrainArea, {foreignKey: "brainAreaId"});
        SearchContent.belongsTo(models.Neuron, {foreignKey: "neuronId"});
        SearchContent.belongsTo(models.TracingStructure, {foreignKey: "tracingStructureId"});
    };

    return SearchContent;
}
