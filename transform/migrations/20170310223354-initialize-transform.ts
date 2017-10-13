const TracingsTable = "Tracings";
const TracingNodesTable = "TracingNodes";

export = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable(
            TracingsTable,
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

        await queryInterface.addIndex(TracingsTable, ["swcTracingId"]);
        await queryInterface.addIndex(TracingsTable, ["registrationTransformId"]);
        await queryInterface.addIndex(TracingsTable, ["tracingStructureId"]);

        await queryInterface.createTable(
            TracingNodesTable,
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
                        model: TracingsTable,
                        key: "id"
                    }
                },
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
                deletedAt: Sequelize.DATE
            });

        await queryInterface.addIndex(TracingNodesTable, ["tracingId"]);
        await queryInterface.addIndex(TracingNodesTable, ["brainAreaId"]);
        await queryInterface.addIndex(TracingNodesTable, ["structureIdentifierId"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable(TracingNodesTable);
        await queryInterface.dropTable(TracingsTable);
    }
};
