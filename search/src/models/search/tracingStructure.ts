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
        classMethods: {
            associate: models => {
               // TracingStructure.hasMany(models.SwcTracing, {foreignKey: "tracingStructureId", as: "Tracings"});
            }
        },
        timestamps: false,
    });

    return TracingStructure;
}
