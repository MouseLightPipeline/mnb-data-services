import * as path from "path";
import * as fs from "fs";
import * as uuid from "uuid";
import {QueryInterface} from "sequelize";

const fixturePath = path.normalize(path.join(__dirname, "fixtures/mouse-brain-areas.json"));
const fixturePathVolumes = path.normalize(path.join(__dirname, "fixtures/mouse-brain-area-volumes.json"));

interface IVolumeInfo {
    id?: number;
    geometryFile: string;
    geometryEnable: boolean;
}

export = {
    up: async (queryInterface: QueryInterface) => {
        const when = new Date();
        const chunkSize = 250;

        const items = loadAllenBrainAreas(fixturePath, when);

        while (items.length > chunkSize) {
            const chunk = items.splice(0, chunkSize);
            await queryInterface.bulkInsert("BrainAreas", chunk, {});
        }

        if (items.length > 0) {
            await queryInterface.bulkInsert("BrainAreas", items, {});
        }

        await queryInterface.bulkInsert("Fluorophores", loadFluorophores(when), {});
        await queryInterface.bulkInsert("MouseStrains", loadMouseStrains(when), {});
        await queryInterface.bulkInsert("InjectionViruses", loadInjectionViruses(when), {});
    },

    down: function (queryInterface: QueryInterface) {
        return queryInterface.bulkDelete("BrainAreas", null, {});
    }
};

function loadMouseStrains(when: Date) {
    return [{id: "e3fda807-f57c-4b14-b4fd-0accfd668017", name: "C57BL/6J", updatedAt: when, createdAt: when}];
}

function loadInjectionViruses(when: Date) {
    return [{
        id: "7c792530-b1b0-47d3-b4c2-c7089523a78d",
        name: "AAV2/1.FLEX-eGFP",
        updatedAt: when,
        createdAt: when
    }, {
        id: uuid.v4(),
        name: "75b6241f-6c5c-4415-a329-e18862e4cc9e",
        updatedAt: when,
        createdAt: when
    }];
}

function loadFluorophores(when: Date) {
    return [{
        id: "47fc1eff-a7e0-4a56-9e4d-5797f8d28d5f",
        name: "eGFP",
        updatedAt: when,
        createdAt: when
    }, {
        id: "48fd3c4e-d0ad-4ef7-8a6d-b62248930ddf",
        name: "tdTomato",
        updatedAt: when,
        createdAt: when
    }];
}

function loadAllenBrainAreas(fixture: string, when: Date) {
    const fileData = fs.readFileSync(fixture, {encoding: "UTF-8"});

    const data = JSON.parse(fileData);

    const volumeInfo = loadAllenBrainAreaVolumes(fixturePathVolumes);

    return data.msg.map((obj: any) => {
        let volume = volumeInfo.find(v => v.id === obj.id);

        if (!volume) {
            volume = {
                geometryFile: "",
                geometryEnable: false
            };
        }

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
            geometryFile: volume.geometryFile,
            geometryColor: obj.color_hex_triplet,
            geometryEnable: volume.geometryEnable,
            updatedAt: when,
            createdAt: when
        };
    });
}

function loadAllenBrainAreaVolumes(fixture: string): IVolumeInfo[] {
    const fileData = fs.readFileSync(fixture, {encoding: "UTF-8"});

    const data = JSON.parse(fileData);

    return data.map((obj: any) => {
        return {
            id: parseInt(obj.id),
            geometryFile: obj.filename,
            geometryEnable: !obj.state.disabled
        };
    });
}
