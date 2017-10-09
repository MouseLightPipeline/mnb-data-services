import {IStructureIdentifier, StructureIdentifiers} from "./src/models/swc/structureIdentifier";

const randomWord = require('random-word');

import {PersistentStorageManager} from "./src/models/databaseConnector";
import {IBrainArea, IFluorophore, IInjectionVirus, IMouseStrain} from "ndb-data-models";
import {ITracingStructure} from "./src/models/swc/tracingStructure";
import {IBrainCompartment} from "./src/models/transform/brainCompartmentContents";
import uuid = require("uuid");

let sampleMax = 1;
let neuronsPerSample = 1;
let nodesPerTracing = 400;

const _storageManager = PersistentStorageManager.Instance();

const args = process.argv.slice(2);

if (args.length > 0) {
    sampleMax = parseInt(args[0]);
}

if (args.length > 1) {
    neuronsPerSample = parseInt(args[1]);
}

if (args.length > 2) {
    nodesPerTracing = parseInt(args[2]);
}

let brainAreas: IBrainArea[] = null;
let mouseStrains: IMouseStrain[] = null;
let fluorophores: IFluorophore[] = null;
let viruses: IInjectionVirus[] = null;

let axonTracing: ITracingStructure = null;
let dendriteTracing: ITracingStructure = null;


let soma: IStructureIdentifier = null;
let path: IStructureIdentifier = null;
let endPoint: IStructureIdentifier = null;

_storageManager.whenReady().then(async (b) => {
    brainAreas = await _storageManager.BrainAreas.findAll({});
    mouseStrains = await _storageManager.MouseStrains.findAll({});
    fluorophores = await _storageManager.Fluorophores.findAll({});
    viruses = await _storageManager.InjectionViruses.findAll({});

    axonTracing = await _storageManager.TracingStructures.findOne({where: {name: "axon"}});
    dendriteTracing = await _storageManager.TracingStructures.findOne({where: {name: "dendrite"}});

    soma = await _storageManager.StructureIdentifiers.findOne({where: {value: StructureIdentifiers.soma}});
    path = await _storageManager.StructureIdentifiers.findOne({where: {value: StructureIdentifiers.undefined}});
    endPoint = await _storageManager.StructureIdentifiers.findOne({where: {value: StructureIdentifiers.endPoint}});

    await populateDatabase();

    console.log("Finished");
}).catch((err) => {
    console.log(err);
});

async function populateDatabase() {
    for (let idx = 0; idx < sampleMax; idx++) {
        const sample = await createSample();
    }
}

function getRandomMouseStrain(): IMouseStrain {
    return randomArrayElement(mouseStrains);
}

function getRandomVirus(): IInjectionVirus {
    return randomArrayElement(viruses);
}

function getRandomFluorophore(): IFluorophore {
    return randomArrayElement(fluorophores);
}

function getRandomBrainArea(): IBrainArea {
    return randomArrayElement(brainAreas);
}

async function createSample() {
    const strain = await getRandomMouseStrain();

    const sample = await _storageManager.Samples.create({
        idNumber: await findNextSampleNumber(),
        sampleDate: new Date(),
        animalId: randomIndex(20000),
        tag: randomWord(),
        comment: randomWord(),
        sharing: 0,
        activeRegistrationTransformId: null,
        mouseStrainId: strain.id
    });

    for (let idx = 0; idx < neuronsPerSample; idx++) {
        const injection = await _storageManager.Injections.create({
            brainAreaId: getRandomBrainArea().id,
            injectionVirusId: getRandomVirus().id,
            injectionVirusName: null,
            fluorophoreId: getRandomFluorophore().id,
            fluorophoreName: null,
            sampleId: sample.id
        });

        const neuron = await _storageManager.Neurons.create({
            idNumber: null,
            idString: `ZZ${randomIndex(9999)}`,
            tag: `Z-${randomIndex(999)}`,
            keywords: `${randomWord()}, ${randomWord()}`,
            x: randomXLocation(),
            y: randomYLocation(),
            z: randomZLocation(),
            sharing: 0,
            brainAreaId: injection.brainAreaId,
            injectionId: injection.id
        });

        await createTracing(neuron, axonTracing.id);

        await createTracing(neuron, dendriteTracing.id);

    }
}

async function createTracing(neuron, tracingStructureId) {
    const swcTracing = await _storageManager.SwcTracings.create({
        annotator: randomWord(),
        neuronId: neuron.id,
        tracingStructureId: tracingStructureId,
        filename: `${randomWord()}.swc`,
        comments: `# ${randomWord()}`,
        offsetX: 0,
        offsetY: 0,
        offsetZ: 0
    });

    const nodeCount = nodesPerTracing + (randomIndex(nodesPerTracing) - nodesPerTracing / 2);

    let nodeData = [];

    let nextX = neuron.x;
    let nextY = neuron.y;
    let nextZ = neuron.z;

    for (let ndx = 1; ndx <= nodeCount; ndx++) {
        nodeData.push({
            swcTracingId: swcTracing.id,
            sampleNumber: ndx,
            structureIdentifierId: path.id,
            x: nextX,
            y: nextY,
            z: nextZ,
            radius: Math.random() * 2,
            parentNumber: ndx === 1 ? -1 : ndx - 1
        });

        nextX = nextX + (Math.random() * 100) - 50;
        nextY = nextY + (Math.random() * 100) - 50;
        nextZ = nextZ + (Math.random() * 100) - 50;
    }

    nodeData[0].structureIdentifierId = soma.id;
    nodeData[nodeData.length - 1].structureIdentifierId = endPoint.id;

    const nodes = await _storageManager.SwcNodes.bulkCreate(nodeData);

    const tracing = await _storageManager.Tracings.create({
        swcTracingId: swcTracing.id,
        registrationTransformId: null,
        nodeCount: nodes.length,
        pathCount: nodes.length - 2,
        branchCount: 0,
        endCount: 1,
        transformedAt: new Date(),
    });

    const compartmentMap = new Map<string, IBrainCompartmentCounts>();

    const tNodes = nodes.map((n) => {
        const brainAreaId = n.sampleNumber === 1 ? neuron.brainAreaId : getRandomBrainArea().id;

        const node = {
            tracingId: tracing.id,
            swcNodeId: n.id,
            sampleNumber: n.sampleNumber,
            x: n.x,
            y: n.y,
            z: n.z,
            radius: n.radius,
            parentNumber: n.parentNumber,
            structureIdentifierId: n.structureIdentifierId,
            brainAreaId: n.sampleNumber === 1 ? neuron.brainAreaId : getRandomBrainArea().id,
            lengthToParent: 0
        };

        if (!compartmentMap.has(brainAreaId)) {
            compartmentMap.set(brainAreaId, {
                node: 0,
                soma: 0,
                path: 0,
                branch: 0,
                end: 0
            })
        }

        let counts = compartmentMap.get(brainAreaId);

        counts.node += 1;

        if (n.sampleNumber === 1) {
            counts.soma++;
        } else {
            counts.path++;
        }

        return node;
    });

    await _storageManager.Nodes.bulkCreate(tNodes);

    let compartments: IBrainCompartment[] = [];

    for (const entry of compartmentMap.entries()) {
        compartments.push({
            id: uuid.v4(),
            brainAreaId: entry[0],
            tracingId: tracing.id,
            nodeCount: entry[1].node,
            somaCount: entry[1].soma,
            pathCount: entry[1].path,
            branchCount: entry[1].branch,
            endCount: entry[1].end
        });
    }

    await _storageManager.BrainCompartment.bulkCreate(compartments);
}

function randomIndex(max: number): number {
    return Math.floor(Math.random() * max);
}

function randomXLocation(): number {
    return Math.random() * (8481 - 2961) + 2961;
}

function randomYLocation(): number {
    return Math.random() * (6054 - 2335) + 2335;
}

function randomZLocation(): number {
    return Math.random() * (8997 - 2525) + 2525;
}

function randomArrayElement<T>(items: T[]): T {
    return items[randomIndex(items.length)];
}

async function findNextSampleNumber() {
    const existing = await _storageManager.Samples.findAll({
        attributes: ["idNumber"],
        order: [["idNumber", "DESC"]],
        limit: 1
    }).map((o) => o.idNumber);

    if (existing.length > 0) {
        return existing[0] + 1;
    } else {
        return 1;
    }
}

interface IBrainCompartmentCounts {
    node: number;
    soma: number;
    path: number;
    branch: number;
    end: number;
}
