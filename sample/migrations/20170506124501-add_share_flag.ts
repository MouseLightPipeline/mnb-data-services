const SamplesTable = "Samples";
const NeuronsTable = "Neurons";

export = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(SamplesTable, "sharing", {type: Sequelize.INTEGER, defaultValue: 0});
    await queryInterface.addColumn(NeuronsTable, "sharing", {type: Sequelize.INTEGER, defaultValue: 0});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(SamplesTable, "sharing");
    await queryInterface.removeColumn(NeuronsTable, "sharing");
  }
}
