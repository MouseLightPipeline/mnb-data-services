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
            "SwcTracings",
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

        // await queryInterface.addIndex("SwcTracings", ["annotator"]); // disallowed by mssql
        await queryInterface.addIndex("SwcTracings", ["neuronId"]);
        await queryInterface.addIndex("SwcTracings", ["tracingStructureId"]);

        await queryInterface.createTable(
            "SwcTracingNodes",
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
                structureIdentifierId: {
                    type: Sequelize.UUID,
                    references: {
                        model: "StructureIdentifiers",
                        key: "id"
                    }
                },
                swcTracingId: {
                    type: Sequelize.UUID,
                    references: {
                        model: "SwcTracings",
                        key: "id"
                    }
                },
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
                deletedAt: Sequelize.DATE
            });

        await queryInterface.addIndex("SwcTracingNodes", ["sampleNumber"]);
        await queryInterface.addIndex("SwcTracingNodes", ["swcTracingId"]);
        await queryInterface.addIndex("SwcTracingNodes", ["structureIdentifierId"]);
    },

    down: async(queryInterface, Sequelize) => {
        await queryInterface.dropTable("SwcTracingNodes");
        await queryInterface.dropTable("SwcTracings");
        await queryInterface.dropTable("TracingStructures");
        await queryInterface.dropTable("StructureIdentifiers");
    }
};
