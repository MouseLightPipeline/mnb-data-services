import {Sequelize, DataTypes, BelongsToGetAssociationMixin} from "sequelize";

import {BaseModel} from "../baseModel";
import {StructureIdentifier} from "./structureIdentifier";
import {SwcTracing} from "./swcTracing";

export type SwcNodeMutationData = {
    id?: string;
    swcTracingId: string | null;
    sampleNumber: number;
    x: number;
    y: number;
    z: number;
    radius: number;
    parentNumber: number;
}

export class SwcNode extends BaseModel {
    public sampleNumber: number;
    public x: number;
    public y: number;
    public z: number;
    public radius: number;
    public parentNumber: number;

    public getStructureIdentifier!: BelongsToGetAssociationMixin<StructureIdentifier>;
    public getTracing!: BelongsToGetAssociationMixin<SwcTracing>;

    public readonly structureIdentifier?: StructureIdentifier;
}

export const modelInit = (sequelize: Sequelize) => {
    SwcNode.init( {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        sampleNumber: DataTypes.INTEGER,
        x: DataTypes.DOUBLE,
        y: DataTypes.DOUBLE,
        z: DataTypes.DOUBLE,
        radius: DataTypes.DOUBLE,
        parentNumber: DataTypes.INTEGER
    }, {
        tableName: "SwcTracingNodes",
        timestamps: true,
        paranoid: false,
        sequelize
    });
};

export const modelAssociate = () => {
    SwcNode.belongsTo(StructureIdentifier, {foreignKey: "structureIdentifierId"});
    SwcNode.belongsTo(SwcTracing, {foreignKey: "swcTracingId", as: "tracing"});
};