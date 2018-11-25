import {Instance, Model} from "sequelize";

export enum SearchStructureIdentifierId {
    undefined = 0,
    soma = 1,
    axon = 2,
    basalDendrite = 3,
    apicalDendrite = 4,
    forkPoint = 5,
    endPoint = 6
}

export interface ISearchStructureIdentifierAttributes {
    id: string;
    name: string;
    value: SearchStructureIdentifierId;
}

export interface ISearchStructureIdentifier extends Instance<ISearchStructureIdentifierAttributes>, ISearchStructureIdentifierAttributes {
}

export interface ISearchStructureIdentifierTable extends Model<ISearchStructureIdentifier, ISearchStructureIdentifierAttributes> {
    countColumnName(s: number | string | ISearchStructureIdentifierAttributes): string | null;
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
        value: DataTypes.INTEGER
    }, {
        timestamps: false,
        freezeTableName: true
    });

    StructureIdentifier.associate = models => {
        // StructureIdentifier.hasMany(models.SwcTracingNode, {foreignKey: "structureIdentifierId", as: "Nodes"});
    };

    return StructureIdentifier;
}
