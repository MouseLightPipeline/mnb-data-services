const path = require('path');
const fs = require('fs');
const uuid = require('uuid');

const fixturePath = path.normalize(__dirname + '/../fixtures/mouse-brain-areas.json');

export = {
    up: async(queryInterface, Sequelize) => {
        const when = new Date();

        await queryInterface.bulkInsert('BrainAreas', loadAllenBrainAreas(fixturePath, when), {});
        await queryInterface.bulkInsert('Fluorophores', loadFluorophores(when), {});
        await queryInterface.bulkInsert('MouseStrains', loadMouseStrains(when), {});
        await queryInterface.bulkInsert('InjectionViruses', loadInjectionViruses(when), {});
    },

    down: function (queryInterface, Sequelize) {
        return queryInterface.bulkDelete('BrainAreas', null, {});
    }
};

function loadMouseStrains(when: Date) {
    return [{id: uuid.v4(), name: 'C57BL/6J', updatedAt: when, createdAt: when}];
}

function loadInjectionViruses(when: Date) {
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

function loadFluorophores(when: Date) {
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

function loadAllenBrainAreas(fixture: string, when: Date) {
    const fileData = fs.readFileSync(fixture, {encoding: 'UTF-8'});

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
