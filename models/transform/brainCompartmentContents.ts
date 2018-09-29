
export interface IBrainCompartment {
    id?: string;
    tracingId: string;
    brainAreaId: string;
    nodeCount: number;
    somaCount: number;
    pathCount: number;
    branchCount: number;
    endCount: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export const TableName = "BrainCompartmentContents";

export function sequelizeImport(sequelize, DataTypes) {
    let BrainCompartmentContents = sequelize.define(TableName, {
        id: {
            primaryKey: true,
            type: DataTypes.UUID
        },
        brainAreaId: DataTypes.UUID,
        nodeCount: DataTypes.INTEGER,
        somaCount: DataTypes.INTEGER,
        pathCount: DataTypes.INTEGER,
        branchCount: DataTypes.INTEGER,
        endCount: DataTypes.INTEGER,
        tracingId: {
            type: DataTypes.UUID,
            references: {
                model: "Tracings",
                key: "id"
            }
        }
    }, {
        classMethods: {
            associate: models => {
                BrainCompartmentContents.belongsTo(models.Tracing, {foreignKey: "tracingId"});
            }
        },
        timestamps: true,
        paranoid: false
    });

    return BrainCompartmentContents;
}
