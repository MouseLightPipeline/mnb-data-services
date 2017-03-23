const TracingsTable = "Tracings";
const BrainCompartmentContentsTable = "BrainCompartmentContents";

export = {
    up: async (queryInterface, Sequelize) => {

        await queryInterface.createTable(
            BrainCompartmentContentsTable,
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                brainAreaId: Sequelize.UUID,
                nodeCount: Sequelize.INTEGER,
                pathCount: Sequelize.INTEGER,
                branchCount: Sequelize.INTEGER,
                endCount: Sequelize.INTEGER,
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

        await queryInterface.addIndex(BrainCompartmentContentsTable, ["tracingId"]);
        await queryInterface.addIndex(BrainCompartmentContentsTable, ["nodeCount"]);
        await queryInterface.addIndex(BrainCompartmentContentsTable, ["pathCount"]);
        await queryInterface.addIndex(BrainCompartmentContentsTable, ["branchCount"]);
        await queryInterface.addIndex(BrainCompartmentContentsTable, ["endCount"]);

        await queryInterface.addColumn(TracingsTable, "nodeCount", Sequelize.INTEGER);
        await queryInterface.addColumn(TracingsTable, "pathCount", Sequelize.INTEGER);
        await queryInterface.addColumn(TracingsTable, "branchCount", Sequelize.INTEGER);
        await queryInterface.addColumn(TracingsTable, "endCount", Sequelize.INTEGER);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable(BrainCompartmentContentsTable);

        await queryInterface.removeColumn(TracingsTable, "nodeCount");
        await queryInterface.removeColumn(TracingsTable, "pathCount");
        await queryInterface.removeColumn(TracingsTable, "branchCount");
        await queryInterface.removeColumn(TracingsTable, "endCount");
    }
}
