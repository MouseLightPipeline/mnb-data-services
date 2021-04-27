import { Sequelize, DataTypes, HasManyGetAssociationsMixin} from "sequelize";

import {BaseModel} from "../baseModel";
import {SearchTracingNode} from "./tracingNode";

export enum SearchStructureIdentifiers {
    undefined = 0,
    soma = 1,
    axon = 2,
    basalDendrite = 3,
    apicalDendrite = 4,
    forkPoint = 5,
    endPoint = 6
}

export class SearchStructureIdentifier extends BaseModel {
    public name: string;
    public value: SearchStructureIdentifiers;

    public getNodes!: HasManyGetAssociationsMixin<SearchTracingNode>;

    public static valueIdMap = new Map<number, string>();
    public static idValueMap = new Map<string, number>();

    public static async buildIdValueMap()  {
        if (this.valueIdMap.size === 0) {
            const all = await SearchStructureIdentifier.findAll({});
            all.forEach(s => {
                this.valueIdMap.set(s.value, s.id);
                this.idValueMap.set(s.id, s.value);
            });
        }
    }

    public static idForValue(val: number) {
        return this.valueIdMap.get(val);
    }

    public static valueForId(id: string) {
        return this.idValueMap.get(id);
    }

    public static structuresAreLoaded () {
        return this.valueIdMap.size > 0;
    }

    public static countColumnName(s: number | string | SearchStructureIdentifier): string {
        if (s === null || s === undefined) {
            return null;
        }

        let value: number = null;

        if (typeof s === "number") {
            value = s;
        } else if (typeof s === "string") {
            value = this.idValueMap.get(s);
        } else {
            value = s.value;
        }

        if (value === null || value === undefined) {
            return null;
        }

        switch (value) {
            case SearchStructureIdentifiers.soma:
                return "somaCount";
            case SearchStructureIdentifiers.undefined:
                return "pathCount";
            case SearchStructureIdentifiers.forkPoint:
                return "branchCount";
            case SearchStructureIdentifiers.endPoint:
                return "endCount";
        }

        return null;
    };
}

export const modelInit = (sequelize: Sequelize) => {
    SearchStructureIdentifier.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.TEXT,
        value: DataTypes.INTEGER,
    }, {
        tableName: "StructureIdentifier",
        timestamps: true,
        sequelize
    });
};

export const modelAssociate = () => {
    SearchStructureIdentifier.hasMany(SearchTracingNode, {foreignKey: "structureIdentifierId", as: "nodes"});

    SearchStructureIdentifier.buildIdValueMap().then();
};
