import {Sequelize, DataTypes, HasManyGetAssociationsMixin} from "sequelize";

import {BaseModel} from "../transform/baseModel";
import {SearchSample} from "./sample";

export class SearchMouseStrain extends BaseModel {
    public name: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    public getSamples!: HasManyGetAssociationsMixin<SearchSample>;
}

export const modelInit = (sequelize: Sequelize) => {
    SearchMouseStrain.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.TEXT
    }, {
        tableName: "MouseStrain",
        timestamps: true,
        sequelize
    });
};

export const modelAssociate = () => {
    SearchMouseStrain.hasMany(SearchSample, {foreignKey: "mouseStrainId"});
};
