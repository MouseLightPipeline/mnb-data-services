export = {
    up: async(queryInterface, Sequelize) => {
        await queryInterface.createTable(
            "InjectionViruses",
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                name: Sequelize.TEXT,
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
                deletedAt: Sequelize.DATE
            });

        await queryInterface.createTable(
            "Fluorophores",
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                name: Sequelize.TEXT,
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
                deletedAt: Sequelize.DATE
            });

        await queryInterface.createTable(
            "MouseStrains",
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                name: Sequelize.TEXT,
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
                deletedAt: Sequelize.DATE
            });

        await queryInterface.createTable(
            "BrainAreas",
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                structureId: Sequelize.INTEGER,
                atlasId: Sequelize.INTEGER,
                graphId: Sequelize.INTEGER,
                graphOrder: Sequelize.INTEGER,
                hemisphereId: Sequelize.INTEGER,
                depth: Sequelize.INTEGER,
                parentStructureId: Sequelize.INTEGER,
                structureIdPath: Sequelize.TEXT,
                name: Sequelize.TEXT,
                safeName: Sequelize.TEXT,
                acronym: Sequelize.TEXT,
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
                deletedAt: Sequelize.DATE
            });

        await queryInterface.addIndex("BrainAreas", ["depth"]);
        await queryInterface.addIndex("BrainAreas", ["parentStructureId"]);

        await queryInterface.createTable(
            "Samples",
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                idNumber: {
                    type: Sequelize.INTEGER,
                    defaultValue: -1
                },
                animalId: Sequelize.TEXT,
                tag: {
                    type: Sequelize.TEXT,
                    defaultValue: ''
                },
                comment: {
                    type: Sequelize.TEXT,
                    defaultValue: ''
                },
                sampleDate: Sequelize.DATE,
                activeRegistrationTransformId: {
                    type: Sequelize.TEXT,
                    defaultValue: ''
                },
                mouseStrainId: {
                    type: Sequelize.UUID,
                    references: {
                        model: "MouseStrains",
                        key: "id"
                    }
                },
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
                deletedAt: Sequelize.DATE
            });

        await queryInterface.addIndex("Samples", ["mouseStrainId"]);

        await queryInterface.createTable(
            "RegistrationTransforms",
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                location: Sequelize.TEXT,
                name: Sequelize.TEXT,
                notes: Sequelize.TEXT,
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
                deletedAt: Sequelize.DATE,
                sampleId: {
                    type: Sequelize.UUID,
                    references: {
                        model: "Samples",
                        key: "id"
                    }
                }
            });

        await queryInterface.addIndex("RegistrationTransforms", ["sampleId"]);

        await queryInterface.createTable(
            "Injections",
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
                deletedAt: Sequelize.DATE,
                brainAreaId: {
                    type: Sequelize.UUID,
                    references: {
                        model: "BrainAreas",
                        key: "id"
                    }
                },
                fluorophoreId: {
                    type: Sequelize.UUID,
                    references: {
                        model: "Fluorophores",
                        key: "id"
                    }
                },
                injectionVirusId: {
                    type: Sequelize.UUID,
                    references: {
                        model: "InjectionViruses",
                        key: "id"
                    }
                },
                sampleId: {
                    type: Sequelize.UUID,
                    references: {
                        model: "Samples",
                        key: "id"
                    }
                }
            });

        await queryInterface.addIndex("Injections", ["fluorophoreId"]);
        await queryInterface.addIndex("Injections", ["injectionVirusId"]);
        await queryInterface.addIndex("Injections", ["sampleId"]);

        await queryInterface.createTable(
            "Neurons",
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                idNumber: {
                    type: Sequelize.INTEGER,
                    defaultValue: -1
                },
                tag: {
                    type: Sequelize.TEXT,
                    defaultValue: ''
                },
                keywords: {
                    type: Sequelize.TEXT,
                    defaultValue: ''
                },
                x: {
                    type: Sequelize.DOUBLE,
                    defaultValue: 0
                },
                y: {
                    type: Sequelize.DOUBLE,
                    defaultValue: 0
                },
                z: {
                    type: Sequelize.DOUBLE,
                    defaultValue: 0
                },
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
                deletedAt: Sequelize.DATE,
                brainAreaId: {
                    type: Sequelize.UUID,
                    references: {
                        model: "BrainAreas",
                        key: "id"
                    }
                },
                injectionId: {
                    type: Sequelize.UUID,
                    references: {
                        model: "Injections",
                        key: "id"
                    }
                }
            });

        await queryInterface.addIndex("Neurons", ["brainAreaId"]);
        await queryInterface.addIndex("Neurons", ["injectionId"]);
    },

    down: async(queryInterface, Sequelize) => {
        await queryInterface.dropTable("Neurons");
        await queryInterface.dropTable("Injections");
        await queryInterface.dropTable("RegistrationTransforms");
        await queryInterface.dropTable("Samples");
        await queryInterface.dropTable("MouseStrains");
        await queryInterface.dropTable("BrainAreas");
        await queryInterface.dropTable("InjectionViruses");
        await queryInterface.dropTable("Fluorophores");
    }
};
