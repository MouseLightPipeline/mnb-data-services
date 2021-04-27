import {
    BelongsToGetAssociationMixin,
    DataTypes, FindOptions,
    HasManyGetAssociationsMixin,
    Sequelize
} from "sequelize";

import {BaseModel} from "../baseModel";
import {SearchMouseStrain} from "./mouseStrain";

export type SearchSampleAttributes = {
    idNumber?: number;
    animalId?: string;
    tag?: string;
    comment?: string;
    sampleDate?: Date;
    searchScope?: number;
    updatedAt?: Date;
}

export class SearchSample extends BaseModel {
    public idNumber: number;
    public animalId: string;
    public tag: string;
    public comment: string;
    public sampleDate: Date;
    public searchScope?: number;

    public getMouseStrain!: BelongsToGetAssociationMixin<SearchMouseStrain>;
}

export const modelInit = (sequelize: Sequelize) => {
    SearchSample.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        idNumber: {
            type: DataTypes.INTEGER,
            defaultValue: -1
        },
        animalId: DataTypes.TEXT,
        tag: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        comment: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        searchScope: DataTypes.INTEGER
    }, {
        tableName: "Sample",
        timestamps: true,
        sequelize
    });
};

export const modelAssociate = () => {
    SearchSample.belongsTo(SearchMouseStrain, {foreignKey: "mouseStrainId", as: "mouseStrain"});
};
