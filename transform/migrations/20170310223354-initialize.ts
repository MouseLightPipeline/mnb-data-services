"use strict";

export = {
    up: async(queryInterface, Sequelize) => {
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
                transformedAt:Sequelize.DATE,
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
                deletedAt: Sequelize.DATE
            });

        await queryInterface.createTable(
            "TracingNodes",
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                sampleNumber: Sequelize.INTEGER,
                x: Sequelize.DOUBLE,
                y: Sequelize.DOUBLE,
                z: Sequelize.DOUBLE,
                radius: Sequelize.DOUBLE,
                parentNumber: Sequelize.INTEGER,
                swcNodeId: Sequelize.UUID,
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
    },

    down: async(queryInterface, Sequelize) => {
        await queryInterface.dropTable("TracingNodes");
        await queryInterface.dropTable("Tracings");
    }
};
