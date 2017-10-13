const uuid = require("uuid");

export = {
    up: async(queryInterface, Sequelize) => {
        const when = new Date();

        await queryInterface.bulkInsert("StructureIdentifiers", loadStructureIdentifiers(when), {});
        await queryInterface.bulkInsert("TracingStructures", loadTracingStructures(when), {});
    },

    down: function (queryInterface, Sequelize) {
        return queryInterface.bulkDelete("BrainAreas", null, {});
    }
};

function loadTracingStructures(when: Date) {
    return [
        {
            id: "68e76074-1777-42b6-bbf9-93a6a5f02fa4",
            name: "axon",
            value: 1,
            updatedAt: when,
            createdAt: when
        },
        {
            id: "aef2ba31-8f9b-4a47-9de0-58dab1cc06a8",
            name: "dendrite",
            value: 2,
            updatedAt: when,
            createdAt: when
        }
    ];
}

function loadStructureIdentifiers(when: Date) {
    return [
        {
            id: "9b2cf056-1fba-468f-a877-04169dd9f708",
            name: "path",
            swcName: "undefined",
            value: 0,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: "6afcafa5-ec7f-4899-8941-3e1f812682ce",
            name: "soma",
            swcName: "soma",
            value: 1,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: "a1df739e-f4a8-4b88-9a25-2cd6b9a7563c",
            name: "axon",
            swcName: "axon",
            value: 2,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: "d8eb210f-65fe-4983-bdcb-e34de5ca2e13",
            name: "(basal) dendrite",
            swcName: "(basal) dendrite",
            value: 3,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: "a3dec6a1-7484-45a7-bc05-cf3d6014c44d",
            name: "apical dendrite",
            swcName: "apical dendrite",
            value: 4,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: "2a8efa78-1067-4ce8-8e4f-cfcf9cf7d315",
            name: "branch point",
            swcName: "fork point",
            value: 5,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: "c37953e1-a1e9-4b9a-847e-08d9566ced65",
            name: "end point",
            swcName: "end point",
            value: 6,
            mutable: false,
            updatedAt: when,
            createdAt: when
        }
    ];
}
