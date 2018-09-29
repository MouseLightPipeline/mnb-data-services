import {ISwcTracing} from "../swc/tracing";
import {ITracingNode} from "./tracingNode";

export enum ExportFormat {
    SWC = 0,
    JSON = 1
}

export interface ITracing {
    id: string;
    swcTracingId?: string;
    registrationTransformId?: string;
    nodeCount?: number;
    pathCount?: number;
    branchCount?: number;
    endCount?: number;
    transformedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;

    getNodes?(): ITracingNode[];
    applyTransform?();
}

export const TableName = "Tracing";

export function sequelizeImport(sequelize, DataTypes) {
    let Tracing = sequelize.define(TableName, {
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
        paranoid: false
    });

    Tracing.associate = models => {
        Tracing.hasMany(models.TracingNode, {foreignKey: "tracingId", as: "nodes"});
        Tracing.hasMany(models.BrainCompartmentContents, {foreignKey: "tracingId", as: "compartments"});
    };

    Tracing.findForSwcTracing = async (swcTracing: ISwcTracing, registration) => {
        const result = await Tracing.findOrCreate({
            where: {
                swcTracingId: swcTracing.id,
                registrationTransformId: registration.id
            }
        });

        return (result && result.length > 0) ? result[0] : null;
    };

    return Tracing;
}
