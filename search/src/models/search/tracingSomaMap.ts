export const TableName = "TracingSomaMap";

export function sequelizeImport(sequelize, DataTypes) {
    const TracingSomaMap = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
    }, {
        classMethods: {
            associate: models => {
                TracingSomaMap.belongsTo(models.Tracing, {foreignKey: "tracingId"});
                TracingSomaMap.belongsTo(models.TracingNode, {foreignKey: "somaId", as: "soma"});
            }
        },
        timestamps: false,
        tableName: TableName
    });

    return TracingSomaMap;
}
