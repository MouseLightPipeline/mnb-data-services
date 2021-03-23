import {BelongsToGetAssociationMixin, DataTypes, Sequelize} from "sequelize";

import {BaseModel} from "./baseModel";
import {Tracing} from "./tracing";

export class BrainCompartmentMutationData {
    id?: string;
    tracingId: string;
    brainAreaId: string;
    nodeCount: number;
    somaCount: number;
    pathCount: number;
    branchCount: number;
    endCount: number;
}

export class BrainCompartment extends BaseModel {
    public brainAreaId: string;
    public nodeCount: number;
    public somaCount: number;
    public pathCount: number;
    public branchCount: number;
    public endCount: number;
    public tracingId?: string;

    public getTracing!: BelongsToGetAssociationMixin<Tracing>;

    public tracing?: Tracing;
}

export class CcfV25BrainCompartment extends BrainCompartment {}

export const modelInit = (sequelize: Sequelize) => {
    CcfV25BrainCompartment.init({
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
        tableName: "CcfV25BrainCompartmentContents",
        timestamps: true,
        paranoid: false,
        sequelize
    });
};

export const modelAssociate = () => {
    CcfV25BrainCompartment.belongsTo(Tracing, {foreignKey: "tracingId"});
};