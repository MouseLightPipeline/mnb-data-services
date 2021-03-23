import {Sequelize, DataTypes, BelongsToGetAssociationMixin, HasManyGetAssociationsMixin} from "sequelize";

const debug = require("debug")("mnb:search-api:neuron-model");

import {BaseModel} from "../transform/baseModel";
import {SearchBrainArea} from "./brainArea";
import {SearchTracing} from "./tracing";
import {SearchSample} from "./sample";
import {SearchContent} from "./searchContent";
import {SearchTracingStructure} from "./tracingStructure";
import {SearchTracingNode} from "./tracingNode";

export enum ConsensusStatus {
    Full,
    Partial,
    Single,
    Pending,
    None
}

// Currently using Team, Internal, and Public when generating this database and composing queries.  Allowing for
// additional future fidelity without having to break any existing clients.
export enum SearchScope {
    Private = 0,
    Team = 1,
    Division = 2,
    Internal = 3,
    Moderated = 4,
    External = 5,
    Public = 6,
    Published
}

type NeuronCache = Map<string, SearchNeuron>;

class NeuronCounts {
    [key: number]: number;
}

export type SearchNeuronAttributes = {
    id?: string;
    idString?: string;
    tag?: string;
    keywords?: string;
    x?: number;
    y?: number;
    z?: number;
    doi?: string;
    consensus?: ConsensusStatus;
    searchScope?: SearchScope;
    brainAreaId?: string;
    updatedAt?: Date;
}

export class SearchNeuron extends BaseModel {
    public idString: string;
    public tag: string;
    public keywords: string;
    public x: number;
    public y: number;
    public z: number;
    public doi: string;
    public consensus: ConsensusStatus;
    public searchScope: SearchScope;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    public brainAreaId?: string;

    public getBrainArea!: BelongsToGetAssociationMixin<SearchBrainArea>;
    public getSample!: BelongsToGetAssociationMixin<SearchSample>;
    public getSearchContents!: HasManyGetAssociationsMixin<SearchContent>;
    public getTracings!: HasManyGetAssociationsMixin<SearchTracing>;

    public tracings?: SearchTracing[];
    public brainArea?: SearchBrainArea;

    private static _neuronCache: NeuronCache = new Map<string, SearchNeuron>();

    private static _neuronCounts = new NeuronCounts();

    public static getOne(id: string): SearchNeuron {
        return this._neuronCache.get(id);
    }

    public static neuronCount(scope: SearchScope) {
        if (scope === null || scope === undefined) {
            return this._neuronCounts[SearchScope.Published];
        }

        return this._neuronCounts[scope];
    }

    public static async loadNeuronCache() {
        debug(`loading neurons`);

        const neurons: SearchNeuron[] = await SearchNeuron.findAll({
            include: [
                {
                    model: SearchBrainArea,
                    as: "brainArea"
                },
                {
                    model: SearchTracing,
                    as: "tracings",
                    include: [{
                        model: SearchTracingStructure,
                        as: "tracingStructure"
                    }, {
                        model: SearchTracingNode,
                        as: "soma"
                    }]
                }
            ]
        });

        debug(`loaded ${neurons.length} neurons`);


        neurons.map((n) => {
            if (n.brainArea === null && n.tracings.length > 0 && n.tracings[0].soma) {
                n.brainArea = SearchBrainArea.getOne(n.tracings[0].soma.brainAreaId);
            }

            this._neuronCache.set(n.id, n);
        });

        this._neuronCounts[SearchScope.Private] = this._neuronCounts[SearchScope.Team] = neurons.length;

        this._neuronCounts[SearchScope.Division] = this._neuronCounts[SearchScope.Internal] = this._neuronCounts[SearchScope.Moderated] = neurons.filter(n => n.searchScope >= SearchScope.Division).length;

        this._neuronCounts[SearchScope.External] = this._neuronCounts[SearchScope.Public] = this._neuronCounts[SearchScope.Published] = neurons.filter(n => n.searchScope >= SearchScope.External).length;

        debug(`${this.neuronCount(SearchScope.Team)} team-visible neurons`);
        debug(`${this.neuronCount(SearchScope.Internal)} internal-visible neurons`);
        debug(`${this.neuronCount(SearchScope.Public)} public-visible neurons`);


    }

}

export const modelInit = (sequelize: Sequelize) => {
    SearchNeuron.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        idString: DataTypes.TEXT,
        tag: DataTypes.TEXT,
        keywords: DataTypes.TEXT,
        x: DataTypes.DOUBLE,
        y: DataTypes.DOUBLE,
        z: DataTypes.DOUBLE,
        searchScope: DataTypes.INTEGER,
        consensus: DataTypes.INTEGER,
        doi: DataTypes.TEXT
    }, {
        tableName: "Neuron",
        timestamps: true,
        sequelize
    });
};

export const modelAssociate = () => {
    SearchNeuron.belongsTo(SearchSample, {foreignKey: {name: "sampleId"}});
    SearchNeuron.belongsTo(SearchBrainArea, {foreignKey: {name: "brainAreaId", allowNull: true}, as: "brainArea"});
    SearchNeuron.hasMany(SearchTracing, {foreignKey: "neuronId", as: "tracings"});
    SearchNeuron.hasMany(SearchContent, {foreignKey: "neuronId"});
};
