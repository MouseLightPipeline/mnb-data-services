import {DataTypes, HasManyGetAssociationsMixin, Sequelize} from "sequelize";

import {BaseModel} from "../baseModel";
import {TracingNode} from "./tracingNode";
import {SwcTracing} from "../swc/swcTracing";
import {CcfV25CompartmentSearchContent} from "./ccfv25CompartmentSearchContent";
import {CcfV30CompartmentSearchContent} from "./ccfV30CompartmentSearchContent";

export enum ExportFormat {
    SWC = 0,
    JSON = 1
}

export class Tracing extends BaseModel {
    public swcTracingId?: string;
    public registrationTransformId?: string;
    public nodeCount?: number;
    public pathCount?: number;
    public branchCount?: number;
    public endCount?: number;
    public transformedAt?: Date;

    public getNodes!: HasManyGetAssociationsMixin<TracingNode>;
    public getV25Compartments!: HasManyGetAssociationsMixin<CcfV25CompartmentSearchContent>;
    public getV30Compartments!: HasManyGetAssociationsMixin<CcfV30CompartmentSearchContent>;

    public nodes?: TracingNode[];

    public static async findForSwcTracing(swcTracing: SwcTracing, registration): Promise<Tracing> {
        const result = await Tracing.findOrCreate({
            where: {
                swcTracingId: swcTracing.id,
                registrationTransformId: registration.id
            }
        });

        return (result && result.length > 0) ? result[0] : null;
    }
}

export const modelInit = (sequelize: Sequelize) => {
    Tracing.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        // reference to original, unmodified tracing (from swc, etc) from swc database
        swcTracingId: DataTypes.UUID,
        // reference to registration transform from sample database
        registrationTransformId: DataTypes.UUID,
        nodeCount: DataTypes.INTEGER,
        pathCount: DataTypes.INTEGER,
        branchCount: DataTypes.INTEGER,
        endCount: DataTypes.INTEGER,
        transformedAt: DataTypes.DATE
    }, {
        timestamps: true,
        paranoid: false,
        sequelize
    });
};

export const modelAssociate = () => {
    Tracing.hasMany(TracingNode, {foreignKey: "tracingId", as: "nodes"});
    Tracing.hasMany(CcfV25CompartmentSearchContent, {foreignKey: "tracingId", as: "v25Compartments"});
    Tracing.hasMany(CcfV30CompartmentSearchContent, {foreignKey: "tracingId", as: "v30Compartments"});
};