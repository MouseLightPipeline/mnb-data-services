import {Sequelize, Op, WhereOptions} from "sequelize";
import {SearchTracing} from "./tracing";
import {SearchBrainArea} from "./brainArea";
import {SearchNeuron} from "./neuron";
import {SearchTracingStructure} from "./tracingStructure";
import {
    ISearchContentOptimize,
    SearchContentAttributes,
    SearchContentBase,
    SearchContentModelAttributes
} from "./searchContent";

export class CcfV25SearchContent extends SearchContentBase {
    public static async findForTracingIdsWithSoma(tracingIds: string[]): Promise<SearchContentBase[]> {
        return CcfV25SearchContent.findAll({
            where: {
                tracingId: {[Op.in]: tracingIds},
                somaCount: {[Op.gt]: 0}
            }
        });
    }

    public static async findForTracingIdWithCompartment(tracingId: string, compartmentId: string): Promise<SearchContentBase> {
        return CcfV25SearchContent.findOne({
            where: {
                tracingId: tracingId,
                brainAreaId: compartmentId
            }
        });
    }

    public static async destroyForTracingIds(tracingIds: string[]): Promise<void> {
        await CcfV25SearchContent.destroy({where: {tracingId: {[Op.in]: tracingIds}}});
    }

    public static async addAll(content: SearchContentAttributes[]): Promise<void> {
        await CcfV25SearchContent.bulkCreate(content);
    }

    public static async addNew(content: SearchContentAttributes): Promise<void> {
        await CcfV25SearchContent.create(content, {isNewRecord: true});
    }

    public static async removeWhere(where: WhereOptions): Promise<number> {
        const count = await CcfV25SearchContent.count({where});

        if (count > 0) {
            await CcfV25SearchContent.destroy({where});
        }

        return count;
    }
}

export const modelInit = (sequelize: Sequelize) => {
    CcfV25SearchContent.init(SearchContentModelAttributes, {
        tableName: "CcfV25SearchContent",
        timestamps: false,
        sequelize
    });
};

export const modelAssociate = () => {
    CcfV25SearchContent.belongsTo(SearchTracing, {foreignKey: "tracingId", as: "tracing"});
    CcfV25SearchContent.belongsTo(SearchBrainArea, {foreignKey: "brainAreaId", as: "brainArea"});
    CcfV25SearchContent.belongsTo(SearchNeuron, {foreignKey: "neuronId", as: "neuron"});
    CcfV25SearchContent.belongsTo(SearchTracingStructure, {foreignKey: "tracingStructureId", as: "tracingStructure"});
};
