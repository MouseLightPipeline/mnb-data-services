import {Sequelize, DataTypes, BelongsToGetAssociationMixin, HasManyGetAssociationsMixin} from "sequelize";

const debug = require("debug")("mnb:search-api:neuron-model");

import {BaseModel} from "../baseModel";
import {SearchBrainArea} from "./brainArea";
import {SearchTracing} from "./tracing";
import {SearchSample} from "./sample";
import {CcfV25SearchContent} from "./ccfV25SearchContent";
import {CcfV30SearchContent} from "./ccfV30SearchContent";

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

export type SearchNeuronAttributes = {
    id: string;
    idString: string;
    tag: string;
    keywords: string;
    x: number;
    y: number;
    z: number;
    doi: string;
    consensus: ConsensusStatus;
    searchScope: SearchScope;
    brainAreaId?: string;
    manualSomaCompartmentId?: string;
    legacySomaIds?: string;
    hortaDeepLink?: string;
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
    public brainAreaId?: string;
    public manualSomaCompartmentId?: string;
    public legacySomaIds?: string;
    public hortaDeepLink?: string;

    public getBrainArea!: BelongsToGetAssociationMixin<SearchBrainArea>;
    public getSample!: BelongsToGetAssociationMixin<SearchSample>;
    public getTracings!: HasManyGetAssociationsMixin<SearchTracing>;
    public getManualSomaCompartment!: BelongsToGetAssociationMixin<SearchBrainArea>;

    public tracings?: SearchTracing[];
    public brainArea?: SearchBrainArea;
    public manualSomaCompartment?: SearchBrainArea;
    public legacySomaCompartments?: SearchBrainArea[];
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
        doi: DataTypes.TEXT,
        hortaDeepLink: DataTypes.TEXT,
        legacySomaIds: DataTypes.TEXT,
        legacySomaCompartments: {
            type: DataTypes.VIRTUAL(DataTypes.ARRAY, ["legacySomaIds"]),
            get: function (): string[] {
                const ids = JSON.parse(this.getDataValue("legacySomaIds")) || [];
                return ids.map(id => SearchBrainArea.getOne(id));
            },
            set: function (value: string[]) {
                if (value && value.length === 0) {
                    value = null;
                }

                this.setDataValue("legacySomaIds", JSON.stringify(value));
            }
        }
    }, {
        tableName: "Neuron",
        timestamps: true,
        sequelize
    });
};

export const modelAssociate = () => {
    SearchNeuron.belongsTo(SearchSample, {foreignKey: {name: "sampleId"}});
    SearchNeuron.belongsTo(SearchBrainArea, {foreignKey: {name: "brainAreaId", allowNull: true}, as: "brainArea"});
    SearchNeuron.belongsTo(SearchBrainArea, {foreignKey: "manualSomaCompartmentId", as: "manualSomaCompartment"});
    SearchNeuron.hasMany(SearchTracing, {foreignKey: "neuronId", as: "tracings"});
    SearchNeuron.hasMany(CcfV25SearchContent, {foreignKey: "neuronId"});
    SearchNeuron.hasMany(CcfV30SearchContent, {foreignKey: "neuronId"});
};
