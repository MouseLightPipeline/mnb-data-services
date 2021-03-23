import {BelongsToGetAssociationMixin, DataTypes, Sequelize} from "sequelize";

import {BaseModel} from "./baseModel";
import {Tracing} from "./tracing";

export interface IPageInput {
    tracingId: string;
    offset: number;
    limit: number;
}

export interface INodePage {
    offset: number;
    limit: number;
    totalCount: number;
    hasNextPage: boolean;
    nodes: TracingNode[];
}

export interface ITracingNode {
    swcNodeId: string;
    sampleNumber: number;
    parentNumber: number;
    x: number;
    y: number;
    z: number;
    radius: number;
    lengthToParent: number;
    structureIdentifierId: string;
    brainAreaIdCcfV25: string;
    brainAreaIdCcfV30: string;
}

export class TracingNode extends BaseModel implements ITracingNode {
    public swcNodeId: string;
    public sampleNumber: number;
    public parentNumber: number;
    public x: number;
    public y: number;
    public z: number;
    public radius: number;
    public lengthToParent: number;
    public structureIdentifierId: string;
    public brainAreaIdCcfV25: string;
    public brainAreaIdCcfV30: string;

    public getTracing!: BelongsToGetAssociationMixin<Tracing>;

    public static async getNodePage(page: IPageInput): Promise<INodePage> {
        page = validatePageInput(page);

        let where = {};

        if (page.tracingId) {
            where = {tracingId: page.tracingId};
        }

        const result = await this.findAndCountAll({
            where: where,
            offset: page.offset,
            limit: page.limit,
            order: [["sampleNumber", "ASC"]]
        });

        return {
            offset: page.offset,
            limit: page.limit,
            totalCount: result.count as number,
            hasNextPage: page.offset + page.limit < result.count,
            nodes: result.rows as TracingNode[]
        }
    };

}

export const modelInit = (sequelize: Sequelize) => {
    TracingNode.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        // Unchanged values
        sampleNumber: DataTypes.INTEGER,
        parentNumber: DataTypes.INTEGER,
        radius: DataTypes.DOUBLE,
        lengthToParent: DataTypes.DOUBLE,
        structureIdentifierId: DataTypes.UUID,
        // Modified values
        x: DataTypes.DOUBLE,
        y: DataTypes.DOUBLE,
        z: DataTypes.DOUBLE,
        // Outside refs
        swcNodeId: DataTypes.UUID,
        brainAreaIdCcfV25: DataTypes.UUID,
        brainAreaIdCcfV30: DataTypes.UUID
    }, {
        timestamps: true,
        paranoid: false,
        sequelize
    });
};

export const modelAssociate = () => {
    TracingNode.belongsTo(Tracing, {foreignKey: "tracingId"});
};

const MAX_INT32 = Math.pow(2, 31) - 1;

function validatePageInput(page: IPageInput): IPageInput {
    let offset = 0;
    let limit = MAX_INT32;

    if (!page) {
        return {tracingId: null, offset: offset, limit: limit};
    }

    if (page.offset === null || page.offset === undefined) {
        page.offset = offset;
    }

    if (page.limit === null || page.limit === undefined) {
        page.limit = limit;
    }

    return page;
}
