"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const fixturePath = path.normalize(__dirname + '/../fixtures/mouse-brain-areas.json');
function loadMouseStrains(when) {
    return [{ id: uuid.v4(), name: 'C57BL/6J', updatedAt: when, createdAt: when }];
}
function loadInjectionViruses(when) {
    return [{
            id: uuid.v4(),
            name: 'AAV2/1.FLEX-eGFP',
            updatedAt: when,
            createdAt: when
        }, {
            id: uuid.v4(),
            name: 'AAV2/1.FLEX-tdTomato',
            updatedAt: when,
            createdAt: when
        }];
}
function loadFluorophores(when) {
    return [{
            id: uuid.v4(),
            name: 'eGFP',
            updatedAt: when,
            createdAt: when
        }, {
            id: uuid.v4(),
            name: 'tdTomato',
            updatedAt: when,
            createdAt: when
        }];
}
function loadAllenBrainAreas(fixture, when) {
    const fileData = fs.readFileSync(fixture, { encoding: 'UTF-8' });
    const data = JSON.parse(fileData);
    return data.msg.map(obj => {
        return {
            id: uuid.v4(),
            structureId: obj.id,
            atlasId: obj.atlas_id,
            graphId: obj.graph_id,
            graphOrder: obj.graph_order,
            hemisphereId: obj.hemisphere_id,
            depth: obj.depth,
            parentStructureId: obj.parent_structure_id,
            structureIdPath: obj.structure_id_path,
            name: obj.name,
            safeName: obj.safe_name,
            acronym: obj.acronym,
            updatedAt: when,
            createdAt: when
        };
    });
}
module.exports = {
    up: (queryInterface, Sequelize) => __awaiter(this, void 0, void 0, function* () {
        const when = new Date();
        yield queryInterface.bulkInsert('BrainAreas', loadAllenBrainAreas(fixturePath, when), {});
        yield queryInterface.bulkInsert('Fluorophores', loadFluorophores(when), {});
        yield queryInterface.bulkInsert('MouseStrains', loadMouseStrains(when), {});
        yield queryInterface.bulkInsert('InjectionViruses', loadInjectionViruses(when), {});
    }),
    down: function (queryInterface, Sequelize) {
        return queryInterface.bulkDelete('BrainAreas', null, {});
    }
};
//# sourceMappingURL=20170310235851-initialize.js.map