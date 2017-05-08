const SwcTracingsTable = "SwcTracings";

export = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(SwcTracingsTable, "sharing", {type: Sequelize.INTEGER, defaultValue: 0});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(SwcTracingsTable, "sharing");
  }
}
