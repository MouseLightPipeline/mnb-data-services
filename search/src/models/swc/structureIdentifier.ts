const debug = require("debug")("ndb:transform:structure-identifier");

export interface IStructureIdentifier {
    id: string;
    name: string;
    value: number;
    mutable: boolean;
}

export enum StructureIdentifiers {
    undefined = 0,
    soma = 1,
    axon = 2,
    basalDendrite = 3,
    apicalDendrite = 4,
    forkPoint = 5,
    endPoint = 6
}

export const TableName = "StructureIdentifier";

export function sequelizeImport(sequelize, DataTypes) {
    const StructureIdentifier = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.TEXT,
        value: DataTypes.INTEGER,
        mutable: {type: DataTypes.BOOLEAN, defaultValue: true}
    }, {
        classMethods: {
            associate: models => {
                StructureIdentifier.hasMany(models.SwcTracingNode, {foreignKey: "structureIdentifierId", as: "Nodes"});
            }
        },
        timestamps: true,
        paranoid: true
    });

    const map = new Map<string, number>();
    const reverseMap = new Map<number, String>();

    StructureIdentifier.prepareContents = () => {
        StructureIdentifier.buildIdValueMap();
    };

    StructureIdentifier.buildIdValueMap = async () => {
        if (map.size === 0) {
            const all = await StructureIdentifier.findAll({});
            all.forEach(s => {
                map.set(s.id, s.value);
                reverseMap.set(s.value, s.id);
            });
        }
    };

    StructureIdentifier.idValue = (id: string) => {
        return map.get(id);
    };

    StructureIdentifier.valueId = (value: number) => {
        return reverseMap.get(value);
    };

    StructureIdentifier.structuresAreLoaded = () => {
        return map.size > 0;
    };

    StructureIdentifier.countColumnName = (s: number | string | IStructureIdentifier) => {
        if (s === null || s === undefined) {
            return null;
        }

        let value: number = null;

        if (typeof s === "number") {
            value = s;
        } else if (typeof s === "string") {
            value = map.get(s);
        } else {
            value = s.value;
        }

        if (value === null || value === undefined) {
            return null;
        }

        switch (value) {
            case StructureIdentifiers.soma:
                return "somaCount";
            case StructureIdentifiers.undefined:
                return "pathCount";
            case StructureIdentifiers.forkPoint:
                return "branchCount";
            case  StructureIdentifiers.endPoint:
                return "endCount";
        }

        return null;
    };

    return StructureIdentifier;
}
