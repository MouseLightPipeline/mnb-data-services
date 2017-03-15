'use strict';

module.exports = {
    up: async(queryInterface, Sequelize) => {
        await queryInterface.addColumn("TracingNodes", "brainAreaId", Sequelize.UUID);
        await queryInterface.addColumn("TracingNodes", "lengthToParent", Sequelize.DOUBLE);
    },

    down: async(queryInterface, Sequelize) => {
        await queryInterface.removeColumn("TracingNodes", "brainAreaId");
        await queryInterface.removeColumn("TracingNodes", "lengthToParent");
    }
};
