const  NeuronsTable = "Neurons";

export = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn(NeuronsTable, "idString", {type: Sequelize.TEXT, defaultValue: ""});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn(NeuronsTable, "idString");
    }
}
