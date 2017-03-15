"use strict";

export = {
    up: async(queryInterface, Sequelize) => {
        await queryInterface.createTable(
            "StructureIdentifiers",
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                name: Sequelize.TEXT,
                swcName: Sequelize.TEXT,
                value: Sequelize.INTEGER,
                mutable: {type: Sequelize.BOOLEAN, defaultValue: true},
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
                deletedAt: Sequelize.DATE
            });

        await queryInterface.createTable(
            "TracingStructures",
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                name: Sequelize.TEXT,
                value: Sequelize.INTEGER,
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
                deletedAt: Sequelize.DATE
            });

        await queryInterface.createTable(
            "Tracings",
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                neuronId: Sequelize.UUID,
                filename: {
                    type: Sequelize.TEXT,
                    defaultValue: ''
                },
                annotator: {
                    type: Sequelize.TEXT,
                    defaultValue: ''
                },
                // comment lines found in SWC file
                fileComments: {
                    type: Sequelize.TEXT,
                    defaultValue: ''
                },
                // Janelia offset defined in file comments
                offsetX: {
                    type: Sequelize.DOUBLE,
                    defaultValue: 0
                },
                offsetY: {
                    type: Sequelize.DOUBLE,
                    defaultValue: 0
                },
                offsetZ: {
                    type: Sequelize.DOUBLE,
                    defaultValue: 0
                },
                tracingStructureId: {
                    type: Sequelize.UUID,
                    references: {
                        model: "TracingStructures",
                        key: "id"
                    }
                },
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
                structureIdentifierId: {
                    type: Sequelize.UUID,
                    references: {
                        model: "StructureIdentifiers",
                        key: "id"
                    }
                },
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
        await queryInterface.dropTable("TracingStructures");
        await queryInterface.dropTable("StructureIdentifiers");
    }
};
