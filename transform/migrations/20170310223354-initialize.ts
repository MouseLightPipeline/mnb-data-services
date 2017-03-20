"use strict";

export = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable(
            "Tracings",
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                swcTracingId: Sequelize.UUID,
                registrationTransformId: Sequelize.UUID,
                tracingStructureId: Sequelize.UUID,
                transformedAt: Sequelize.DATE,
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
                deletedAt: Sequelize.DATE
            });

        await queryInterface.addIndex("Tracings", ["swcTracingId"]);
        await queryInterface.addIndex("Tracings", ["registrationTransformId"]);
        await queryInterface.addIndex("Tracings", ["tracingStructureId"]);

        await queryInterface.createTable(
            "TracingNodes",
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                sampleNumber: Sequelize.INTEGER,
                parentNumber: Sequelize.INTEGER,
                x: Sequelize.DOUBLE,
                y: Sequelize.DOUBLE,
                z: Sequelize.DOUBLE,
                radius: Sequelize.DOUBLE,
                lengthToParent: Sequelize.DOUBLE,
                swcNodeId: Sequelize.UUID,
                brainAreaId: Sequelize.UUID,
                structureIdentifierId: Sequelize.UUID,
                tracingId: {
                    type: Sequelize.UUID,
                    references: {
                        model: "Tracings",
                        key: "id"
                    }
                },
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
                deletedAt: Sequelize.DATE
            });

        await queryInterface.addIndex("TracingNodes", ["tracingId"]);
        await queryInterface.addIndex("TracingNodes", ["brainAreaId"]);
        await queryInterface.addIndex("TracingNodes", ["structureIdentifierId"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("TracingNodes");
        await queryInterface.dropTable("Tracings");
    }
};
