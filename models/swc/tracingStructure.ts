export const TableName = "TracingStructure";

export interface ITracingStructure {
    id: string;
    name: string;
    value: number;
}

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
        timestamps: true,
        paranoid: true
    });

    TracingStructure.associate = models => {
        TracingStructure.hasMany(models.SwcTracing, {foreignKey: "tracingStructureId", as: "Tracings"});
    };

    return TracingStructure;
}
