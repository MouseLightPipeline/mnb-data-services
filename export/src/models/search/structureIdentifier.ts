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
        classMethods: {
            associate: models => {
                // StructureIdentifier.hasMany(models.SwcTracingNode, {foreignKey: "structureIdentifierId", as: "Nodes"});
            }
        },
        timestamps: false,
    });

    return StructureIdentifier;
}
