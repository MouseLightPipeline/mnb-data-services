const TracingsTable = "Tracings";

export = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.removeColumn(TracingsTable, "tracingStructureId");
  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.addColumn(TracingsTable, "tracingStructureId");
  }
}
