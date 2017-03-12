"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const uuid = require('uuid');
function loadTracingStructures(when) {
    return [
        {
            id: uuid.v4(),
            name: 'axon',
            updatedAt: when,
            createdAt: when
        },
        {
            id: uuid.v4(),
            name: 'dendrite',
            updatedAt: when,
            createdAt: when
        }
    ];
}
function loadStructureIdentifiers(when) {
    return [
        {
            id: uuid.v4(),
            name: 'undefined',
            value: 0,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: uuid.v4(),
            name: 'soma',
            value: 1,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: uuid.v4(),
            name: 'axon',
            value: 2,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: uuid.v4(),
            name: '(basal) dendrite',
            value: 3,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: uuid.v4(),
            name: 'apical dendrite',
            value: 4,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: uuid.v4(),
            name: 'fork point',
            value: 5,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: uuid.v4(),
            name: 'end point',
            value: 6,
            mutable: false,
            updatedAt: when,
            createdAt: when
        }
    ];
}
module.exports = {
    up: (queryInterface, Sequelize) => __awaiter(this, void 0, void 0, function* () {
        const when = new Date();
        yield queryInterface.bulkInsert('StructureIdentifiers', loadStructureIdentifiers(when), {});
        yield queryInterface.bulkInsert('TracingStructures', loadTracingStructures(when), {});
    }),
    down: function (queryInterface, Sequelize) {
        return queryInterface.bulkDelete('BrainAreas', null, {});
    }
};
//# sourceMappingURL=20170311033337-initialize.js.map