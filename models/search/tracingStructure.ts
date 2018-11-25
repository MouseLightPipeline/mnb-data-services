import {Instance, Model} from "sequelize";

export enum SearchTracingStructureId {
    axon = 1,       // Must match value used in API
    dendrite = 2,   // Must match value used in API
    soma = 3,       // UI-only for selected what to display for a neuron
    all = 4,        // Same as above
    any = -1        // No selection - used for "axonal end point" combinations in query not part of neuron display
}

export interface ISearchTracingStructureAttributes {
    id: string;
    name: string;
    value: SearchTracingStructureId;

}

export interface ISearchTracingStructure extends Instance<ISearchTracingStructureAttributes>, ISearchTracingStructureAttributes {
}

export interface ISearchTracingStructureTable extends Model<ISearchTracingStructure, ISearchTracingStructureAttributes> {
}

export const TableName = "TracingStructure";

export function sequelizeImport(sequelize, DataTypes) {
    const TracingStructure = sequelize.define(TableName, {
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

    TracingStructure.associate = models => {
        TracingStructure.hasMany(models.Tracing, {foreignKey: "tracingStructureId", as: "tracings"});
    };

    return TracingStructure;
}
