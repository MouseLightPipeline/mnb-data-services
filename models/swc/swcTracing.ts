import {Sequelize, DataTypes, BelongsToGetAssociationMixin, HasManyGetAssociationsMixin} from "sequelize";

import {BaseModel} from "../transform/baseModel";
import {TracingStructure} from "./tracingStructure";
import {SwcNode} from "./swcNode";

export interface ISwcTracingInput {
    id?: string;
    neuronId?: string;
    filename?: string;
    annotator?: string;
    fileComments?: string;
    offsetX?: number;
    offsetY?: number;
    offsetZ?: number;
    tracingStructureId?: string;
}

export class SwcTracing extends BaseModel {
    public id: string;
    public neuronId: string;
    public filename: string;
    public annotator: string;
    public fileComments: string;
    public offsetX: number;
    public offsetY: number;
    public offsetZ: number;
    public tracingStructureId?: string;

    public getTracingStructure!: BelongsToGetAssociationMixin<TracingStructure>;
    public getNodes!: HasManyGetAssociationsMixin<SwcNode>;
}

export const modelInit = (sequelize: Sequelize) => {
    SwcTracing.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        // reference to external sample database entry
        neuronId: DataTypes.UUID,
        filename: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        annotator: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        // comment lines found in SWC file
        fileComments: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        // Janelia offset defined in file comments
        offsetX: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        offsetY: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        offsetZ: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        }
    }, {
        timestamps: true,
        paranoid: false,
        sequelize
    });
};

export const modelAssociate = () => {
    SwcTracing.hasMany(SwcNode, {foreignKey: "swcTracingId", as: "Nodes"});
    SwcTracing.belongsTo(TracingStructure, {foreignKey: "tracingStructureId"});
};
