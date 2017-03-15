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
            id: uuid.v4(),
            name: "axon",
            value: 1,
            updatedAt: when,
            createdAt: when
        },
        {
            id: uuid.v4(),
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
            id: uuid.v4(),
            name: "path",
            swcName: "undefined",
            value: 0,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: uuid.v4(),
            name: "soma",
            swcName: "soma",
            value: 1,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: uuid.v4(),
            name: "axon",
            swcName: "axon",
            value: 2,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: uuid.v4(),
            name: "(basal) dendrite",
            swcName: "(basal) dendrite",
            value: 3,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: uuid.v4(),
            name: "apical dendrite",
            swcName: "apical dendrite",
            value: 4,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: uuid.v4(),
            name: "branch",
            swcName: "fork point",
            value: 5,
            mutable: false,
            updatedAt: when,
            createdAt: when
        },
        {
            id: uuid.v4(),
            name: "end",
            swcName: "end point",
            value: 6,
            mutable: false,
            updatedAt: when,
            createdAt: when
        }
    ];
}
