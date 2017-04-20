const BrainAreasTable = "BrainAreas";

export = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn(BrainAreasTable, "geometryFile", {type: Sequelize.TEXT, defaultValue: ""});
        await queryInterface.addColumn(BrainAreasTable, "geometryColor", {type: Sequelize.TEXT, defaultValue: ""});
        await queryInterface.addColumn(BrainAreasTable, "geometryEnable", {type: Sequelize.BOOLEAN, defaultValue: false});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn(BrainAreasTable, "geometryFile");
        await queryInterface.removeColumn(BrainAreasTable, "geometryColor");
        await queryInterface.removeColumn(BrainAreasTable, "geometryEnable");
    }
}
