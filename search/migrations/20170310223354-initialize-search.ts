const TracingsTable = "Tracings";
const TracingNodesTable = "TracingNodes";
const NeuronsTable = "Neurons";
const NeuronCompartmentTable = "NeuronBrainAreaMap";
const BrainAreasTable = "BrainAreas";
const StructureIdentifiersTable = "StructureIdentifiers";
const TracingStructuresTable = "TracingStructures";
const TracingSomaMapTable = "TracingSomaMap";

export = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable(
            BrainAreasTable,
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
                geometryFile: {
                    type: Sequelize.TEXT,
                    defaultValue: ""
                },
                geometryColor: {
                    type: Sequelize.TEXT,
                    defaultValue: ""
                },
                geometryEnable: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false
                },
                acronym: Sequelize.TEXT
            });

        await queryInterface.addIndex(BrainAreasTable, ["depth"]);
        await queryInterface.addIndex(BrainAreasTable, ["structureId"]);
        await queryInterface.addIndex(BrainAreasTable, ["parentStructureId"]);
        await queryInterface.addIndex(BrainAreasTable, ["geometryEnable"]);

        await queryInterface.createTable(
            NeuronsTable,
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                idString: {
                    type: Sequelize.TEXT,
                    defaultValue: ""
                },
                tag: {
                    type: Sequelize.TEXT,
                    defaultValue: ""
                },
                keywords: {
                    type: Sequelize.TEXT,
                    defaultValue: ""
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
                sharing: {
                    type: Sequelize.INTEGER,
                    defaultValue: 1
                },
                doi: {
                    type: Sequelize.TEXT
                },
                brainAreaId: {
                    type: Sequelize.UUID,
                    references: {
                        model: BrainAreasTable,
                        key: "id"
                    }
                },
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
            });

        await queryInterface.addIndex(NeuronsTable, ["brainAreaId"]);

        await queryInterface.createTable(
            StructureIdentifiersTable,
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                name: Sequelize.TEXT,
                value: Sequelize.INTEGER
            });

        await queryInterface.createTable(
            TracingStructuresTable,
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                name: Sequelize.TEXT,
                value: Sequelize.INTEGER
            });

        await queryInterface.createTable(
            TracingsTable,
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                swcTracingId: Sequelize.UUID,
                transformedAt: Sequelize.DATE,
                nodeCount: Sequelize.INTEGER,
                pathCount: Sequelize.INTEGER,
                branchCount: Sequelize.INTEGER,
                endCount: Sequelize.INTEGER,
                tracingStructureId: {
                    type: Sequelize.UUID,
                    references: {
                        model: TracingStructuresTable,
                        key: "id"
                    }
                },
                neuronId: {
                    type: Sequelize.UUID,
                    references: {
                        model: NeuronsTable,
                        key: "id"
                    }
                },
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
            });

        await queryInterface.addIndex(TracingsTable, ["neuronId"]);
        await queryInterface.addIndex(TracingsTable, ["swcTracingId"]);
        await queryInterface.addIndex(TracingsTable, ["tracingStructureId"]);

        await queryInterface.createTable(
            TracingNodesTable,
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
                lengthToParent: Sequelize.DOUBLE,
                swcNodeId: Sequelize.UUID,
                brainAreaId: {
                    type: Sequelize.UUID,
                    references: {
                        model: BrainAreasTable,
                        key: "id"
                    }
                },
                structureIdentifierId: {
                    type: Sequelize.UUID,
                    references: {
                        model: StructureIdentifiersTable,
                        key: "id"
                    }
                },
                tracingId: {
                    type: Sequelize.UUID,
                    references: {
                        model: TracingsTable,
                        key: "id"
                    }
                }
            });

        await queryInterface.addIndex(TracingNodesTable, ["tracingId"]);
        await queryInterface.addIndex(TracingNodesTable, ["brainAreaId"]);
        await queryInterface.addIndex(TracingNodesTable, ["structureIdentifierId"]);

        await queryInterface.createTable(
            TracingSomaMapTable,
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                tracingId: {
                    type: Sequelize.UUID,
                    references: {
                        model: TracingsTable,
                        key: "id"
                    }
                },
                somaId: {
                    type: Sequelize.UUID,
                    references: {
                        model: TracingNodesTable,
                        key: "id"
                    }
                }
            }
        );

        await queryInterface.addIndex(TracingSomaMapTable, ["tracingId"]);

        await queryInterface.createTable(
            NeuronCompartmentTable,
            {
                id: {
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },
                somaX: Sequelize.DOUBLE,
                somaY: Sequelize.DOUBLE,
                somaZ: Sequelize.DOUBLE,
                nodeCount: Sequelize.INTEGER,
                somaCount: Sequelize.INTEGER,
                pathCount: Sequelize.INTEGER,
                branchCount: Sequelize.INTEGER,
                endCount: Sequelize.INTEGER,
                neuronIdString: Sequelize.TEXT,
                neuronDOI: Sequelize.TEXT,
                tracingId: {
                    type: Sequelize.UUID,
                    references: {
                        model: TracingsTable,
                        key: "id"
                    }
                },
                brainAreaId: {
                    type: Sequelize.UUID,
                    references: {
                        model: BrainAreasTable,
                        key: "id"
                    }
                },
                neuronId: {
                    type: Sequelize.UUID,
                    references: {
                        model: NeuronsTable,
                        key: "id"
                    }
                },
                tracingStructureId: {
                    type: Sequelize.UUID,
                    references: {
                        model: TracingStructuresTable,
                        key: "id"
                    }
                }
            });

        await queryInterface.addIndex(NeuronCompartmentTable, ["neuronId"]);
        await queryInterface.addIndex(NeuronCompartmentTable, ["tracingId"]);
        await queryInterface.addIndex(NeuronCompartmentTable, ["brainAreaId"]);
        await queryInterface.addIndex(NeuronCompartmentTable, ["tracingStructureId"]);
        await queryInterface.addIndex(NeuronCompartmentTable, ["nodeCount"]);
        await queryInterface.addIndex(NeuronCompartmentTable, ["somaCount"]);
        await queryInterface.addIndex(NeuronCompartmentTable, ["pathCount"]);
        await queryInterface.addIndex(NeuronCompartmentTable, ["branchCount"]);
        await queryInterface.addIndex(NeuronCompartmentTable, ["endCount"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable(TracingNodesTable);
        await queryInterface.dropTable(TracingsTable);
        await queryInterface.dropTable(NeuronsTable);
        await queryInterface.dropTable(NeuronCompartmentTable);
        await queryInterface.dropTable(BrainAreasTable);
        await queryInterface.dropTable(StructureIdentifiersTable);
        await queryInterface.dropTable(TracingStructuresTable);
        await queryInterface.dropTable(TracingSomaMapTable);
    }
};
