import {BelongsToGetAssociationMixin,} from "sequelize";

import {BaseModel} from "../baseModel";
import {Tracing} from "./tracing";

export abstract class CompartmentSearchContent extends BaseModel {
    public brainAreaId: string;
    public nodeCount: number;
    public somaCount: number;
    public pathCount: number;
    public branchCount: number;
    public endCount: number;
    public tracingId?: string;

    public getTracing!: BelongsToGetAssociationMixin<Tracing>;

    public tracing?: Tracing;

    public static async findForTracingIds(tracingIds: string[]): Promise<CompartmentSearchContent[]> {
        return Promise.resolve([]);
    };
}
