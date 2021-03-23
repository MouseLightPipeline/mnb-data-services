import {DataTypes, Sequelize} from "sequelize";

import {Tracing} from "./tracing";
import {BrainCompartment} from "./ccfv25BrainCompartmentContents";

export class CcfV30BrainCompartment extends BrainCompartment {}

export const modelInit = (sequelize: Sequelize) => {
    CcfV30BrainCompartment.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID
        },
        brainAreaId: DataTypes.UUID,
        nodeCount: DataTypes.INTEGER,
        somaCount: DataTypes.INTEGER,
        pathCount: DataTypes.INTEGER,
        branchCount: DataTypes.INTEGER,
        endCount: DataTypes.INTEGER,
        tracingId: {
            type: DataTypes.UUID,
            references: {
                model: "Tracings",
                key: "id"
            }
        }
    }, {
        tableName: "CcfV30BrainCompartmentContents",
        timestamps: true,
        paranoid: false,
        sequelize
    });

};

export const modelAssociate = () => {
    CcfV30BrainCompartment.belongsTo(Tracing, {foreignKey: "tracingId"});
};