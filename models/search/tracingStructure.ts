import {Sequelize, DataTypes, HasManyGetAssociationsMixin} from "sequelize";

import {BaseModel} from "../transform/baseModel";
import {SearchTracing} from "./tracing";

export class SearchTracingStructure extends BaseModel {
    public id: string;
    public name: string;
    public value: number;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    public getTracings!: HasManyGetAssociationsMixin<SearchTracing>;
}

export const modelInit = (sequelize: Sequelize) => {
    SearchTracingStructure.init( {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.TEXT,
        value: DataTypes.INTEGER
    }, {
        tableName: "TracingStructure",
        timestamps: true,
        sequelize
    });
};

export const modelAssociate = () => {
    SearchTracingStructure.hasMany(SearchTracing, {foreignKey: "tracingStructureId"});
};
