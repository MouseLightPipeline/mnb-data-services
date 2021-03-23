import {Sequelize, DataTypes, HasManyGetAssociationsMixin} from "sequelize";

import {BaseModel} from "../transform/baseModel";
import {SwcTracing} from "./swcTracing";

export enum TracingStructureId {
    axon = 1,       // Must match value used in API
    dendrite = 2,   // Must match value used in API
    soma = 3,       // UI-only for selected what to display for a neuron
    all = 4,        // Same as above
    any = -1        // No selection - used for "axonal end point" combinations in query not part of neuron display
}

export class TracingStructure extends BaseModel {
    public id: string;
    public name: string;
    public value: number;

    public getTracings!: HasManyGetAssociationsMixin<SwcTracing>;
}

export const modelInit = (sequelize: Sequelize) => {
    TracingStructure.init( {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.TEXT,
        value: DataTypes.INTEGER
    }, {
        timestamps: true,
        paranoid: true,
        sequelize
    });
};

export const modelAssociate = () => {
    TracingStructure.hasMany(SwcTracing, {foreignKey: "tracingStructureId", as: "Tracings"});
};
