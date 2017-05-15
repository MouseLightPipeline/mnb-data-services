const TracingsTable = "Tracings";

export = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.removeIndex(TracingsTable, "tracingStructureId");
    await queryInterface.removeColumn(TracingsTable, "tracingStructureId");
  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.addColumn(TracingsTable, "tracingStructureId");
    await queryInterface.addIndex(TracingsTable, ["tracingStructureId"]);
  }
}
