import {Op, Sequelize, WhereOptions} from "sequelize";
import {SearchTracing} from "./tracing";
import {SearchBrainArea} from "./brainArea";
import {SearchNeuron} from "./neuron";
import {SearchTracingStructure} from "./tracingStructure";
import {
    SearchContentAttributes,
    SearchContentBase,
    SearchContentModelAttributes
} from "./searchContent";

export class CcfV30SearchContent extends SearchContentBase {
    public static async findForTracingIdsWithSoma(tracingIds: string[]): Promise<SearchContentBase[]> {
        return CcfV30SearchContent.findAll({
            where: {
                tracingId: {[Op.in]: tracingIds},
                somaCount: {[Op.gt]: 0}
            }
        });
    }

    public static async findForTracingIdWithCompartment(tracingId: string, compartmentId: string): Promise<SearchContentBase> {
        return CcfV30SearchContent.findOne({
            where: {
                tracingId: tracingId,
                brainAreaId: compartmentId
            }
        });
    }

    public static async destroyForTracingIds(tracingIds: string[]): Promise<void> {
        await CcfV30SearchContent.destroy({where: {tracingId: {[Op.in]: tracingIds}}});
    }

    public static async addAll(content: SearchContentAttributes[]): Promise<void> {
        await CcfV30SearchContent.bulkCreate(content);
    }

    public static async addNew(content: SearchContentAttributes): Promise<void> {
        await CcfV30SearchContent.create(content, {isNewRecord: true});
    }

    public static async removeWhere(where: WhereOptions): Promise<number> {
        const count = await CcfV30SearchContent.count({where});

        if (count > 0) {
            await CcfV30SearchContent.destroy({where});
        }

        return count;
    }
}

export const modelInit = (sequelize: Sequelize) => {
    CcfV30SearchContent.init(SearchContentModelAttributes, {
        tableName: "CcfV30SearchContent",
        timestamps: false,
        sequelize
    });
};

export const modelAssociate = () => {
    CcfV30SearchContent.belongsTo(SearchTracing, {foreignKey: "tracingId", as: "tracing"});
    CcfV30SearchContent.belongsTo(SearchBrainArea, {foreignKey: "brainAreaId", as: "brainArea"});
    CcfV30SearchContent.belongsTo(SearchNeuron, {foreignKey: "neuronId", as: "neuron"});
    CcfV30SearchContent.belongsTo(SearchTracingStructure, {foreignKey: "tracingStructureId", as: "tracingStructure"});
    CcfV30SearchContent.belongsTo(SearchBrainArea, {foreignKey: "manualSomaCompartmentId", as: "manualSomaCompartment"});
};
