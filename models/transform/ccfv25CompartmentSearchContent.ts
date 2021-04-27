import { DataTypes, Op, Sequelize} from "sequelize";

import {CompartmentSearchContent} from "./compartmentSearchContent";
import {Tracing} from "./tracing";

export interface ICompartmentContentFindForTracingIds {
    (tracingIds: string[]): Promise<CompartmentSearchContent[]>;
}

export class CcfV25CompartmentSearchContent extends CompartmentSearchContent {
    public static async findForTracingIds(tracingIds: string[]): Promise<CompartmentSearchContent[]> {
        return CcfV25CompartmentSearchContent.findAll({
            where: {
                tracingId: {[Op.in]: tracingIds}
            }
        });
    }
}

export const modelInit = (sequelize: Sequelize) => {
    CcfV25CompartmentSearchContent.init({
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
    CcfV25CompartmentSearchContent.belongsTo(Tracing, {foreignKey: "tracingId"});
};