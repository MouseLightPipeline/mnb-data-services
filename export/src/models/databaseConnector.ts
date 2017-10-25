import {SampleConnector} from "ndb-data-models";
const Sequelize = require("sequelize");

const debug = require("debug")("ndb:transform:database-connector");

import {DatabaseOptions} from "../options/databaseOptions"

import {loadModels} from "./modelLoader";

export interface ISampleDatabaseModels {
    BrainArea?: any
    Fluorophore?: any
    InjectionVirus?: any
    MouseStrain?: any
    Sample?: any;
    Injection?: any;
    RegistrationTransform?: any;
    Neuron?: any;
}

export interface ISwcDatabaseModels {
    SwcTracing?: any;
    SwcTracingNode?: any;
    StructureIdentifier?: any;
    TracingStructure?: any;
}

export interface ITransformDatabaseModels {
    Tracing?: any;
    TracingNode?: any;
    BrainCompartmentContents?: any;
}

export interface ISearchDatabaseModels {
    BrainArea?: any
    StructureIdentifier?: any;
    TracingStructure?: any;
    Neuron?: any;
    Tracing?: any;
    TracingNode?: any;
    NeuronBrainAreaMap?: any;
    TracingSomaMap?: any;
}

export interface ISequelizeDatabase<T> {
    connection: any;
    models: T;
    isConnected: boolean;
}

export class PersistentStorageManager {
    private _isInitialized = false;

    public static Instance(): PersistentStorageManager {
        return _manager;
    }

    public get TransformConnection() {
        return this.transformDatabase.connection;
    }

    public get BrainAreas() {
        return this.sampleDatabase.models.BrainArea;
    }

    public get Samples() {
        return this.sampleDatabase.models.Sample;
    }

    public get Injections() {
        return this.sampleDatabase.models.Injection;
    }

    public get RegistrationTransforms() {
        return this.sampleDatabase.models.RegistrationTransform;
    }

    public get MouseStrains() {
        return this.sampleDatabase.models.MouseStrain;
    }

    public get InjectionViruses() {
        return this.sampleDatabase.models.InjectionVirus;
    }

    public get Fluorophores() {
        return this.sampleDatabase.models.Fluorophore;
    }

    public get Neurons() {
        return this.sampleDatabase.models.Neuron;
    }

    public get TracingStructures() {
        return this.swcDatabase.models.TracingStructure;
    }

    public get StructureIdentifiers() {
        return this.swcDatabase.models.StructureIdentifier;
    }

    public get SwcTracings() {
        return this.swcDatabase.models.SwcTracing;
    }

    public get SwcNodes() {
        return this.swcDatabase.models.SwcTracingNode;
    }

    public get Tracings() {
        return this.transformDatabase.models.Tracing;
    }

    public get Nodes() {
        return this.transformDatabase.models.TracingNode;
    }

    public get BrainCompartment() {
        return this.transformDatabase.models.BrainCompartmentContents;
    }

    public get Search(): ISearchDatabaseModels {
        return this.searchDatabase.models;
    }

    public async initialize() {
        this.sampleDatabase = await createSampleConnection();
        await authenticate(this.swcDatabase, "swc");
        await authenticate(this.transformDatabase, "transform");
        await authenticate(this.searchDatabase, "search");

        this._isInitialized = true;
    }

    public async whenReady(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.checkReady(resolve);
        });
    }

    private checkReady(resolve) {
        if (this._isInitialized) {
            resolve(true);
        } else {
            setTimeout(() => this.checkReady(resolve), 100);
        }
    }

    private sampleDatabase: ISequelizeDatabase<ISampleDatabaseModels>;
    private swcDatabase: ISequelizeDatabase<ISwcDatabaseModels> = createConnection("swc", {});
    private transformDatabase: ISequelizeDatabase<ITransformDatabaseModels> = createConnection("transform", {});
    private searchDatabase: ISequelizeDatabase<ISearchDatabaseModels> = createConnection("search", {});
}

async function authenticate(database, name) {
    try {
        await database.connection.authenticate();

        database.isConnected = true;

        debug(`successful database connection: ${name}`);

        if (name === "swc") {
            Object.keys(database.models).forEach(modelName => {
                if (database.models[modelName].prepareContents) {
                    database.models[modelName].prepareContents(database.models);
                }
            });
        }
    } catch (err) {
        debug(`failed database connection: ${name}`);
        debug(err);
        setTimeout(() => authenticate(database, name), 5000);
    }
}

async function createSampleConnection(): Promise<SampleConnector> {
    const connector = new SampleConnector(DatabaseOptions.sample);

    await connector.authenticate();

    return connector;
}

function createConnection<T>(name: string, models: T) {
    let databaseConfig = DatabaseOptions[name];

    let db: ISequelizeDatabase<T> = {
        connection: null,
        models: models,
        isConnected: false
    };

    debug(`initiating connection: ${databaseConfig.host}:${databaseConfig.port}#${databaseConfig.database}`);

    db.connection = new Sequelize(databaseConfig.database, databaseConfig.username, databaseConfig.password, databaseConfig);

    return loadModels(db, __dirname + "/" + name);
}

const _manager: PersistentStorageManager = new PersistentStorageManager();

_manager.initialize().then(() => {
});
