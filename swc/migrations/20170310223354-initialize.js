"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
module.exports = {
    up: (queryInterface, Sequelize) => __awaiter(this, void 0, void 0, function* () {
        yield queryInterface.createTable("StructureIdentifiers", {
            id: {
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            name: Sequelize.TEXT,
            value: Sequelize.INTEGER,
            mutable: { type: Sequelize.BOOLEAN, defaultValue: true },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
            deletedAt: Sequelize.DATE
        });
        yield queryInterface.createTable("TracingStructures", {
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
        yield queryInterface.createTable("Tracings", {
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
        yield queryInterface.createTable("TracingNodes", {
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
    }),
    down: (queryInterface, Sequelize) => __awaiter(this, void 0, void 0, function* () {
        yield queryInterface.dropTable("TracingNodes");
        yield queryInterface.dropTable("Tracings");
        yield queryInterface.dropTable("TracingStructures");
        yield queryInterface.dropTable("StructureIdentifiers");
    })
};
//# sourceMappingURL=20170310223354-initialize.js.map