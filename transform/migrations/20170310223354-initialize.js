"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
module.exports = {
    up: (queryInterface, Sequelize) => __awaiter(this, void 0, void 0, function* () {
        yield queryInterface.createTable("Tracings", {
            id: {
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            janeliaTracingId: Sequelize.UUID,
            registrationTransformId: Sequelize.UUID,
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
    })
};
//# sourceMappingURL=20170310223354-initialize.js.map