import {ISearchStructureIdentifierTable} from "./search/structureIdentifier";

const Sequelize = require("sequelize");

const debug = require("debug")("ndb:transform:database-connector");

import {DatabaseOptions} from "../options/databaseOptions";

import {loadModels} from "./modelLoader";
import {ISearchContentTable} from "./search/searchContent";
import {ISearchTracingTable} from "./search/tracing";
import {ISearchNeuronTable} from "./search/neuron";
import {ISearchBrainAreaTable} from "./search/brainArea";
import {ISearchTracingNodeTable} from "./search/tracingNode";
import {ISearchTracingStructureTable} from "./search/tracingStructure";

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

export class SearchTables {
    public constructor() {
        this.BrainArea = null;
        this.Neuron = null;
        this.SearchContent = null;
        this.StructureIdentifier = null;
        this.Tracing = null;
        this.TracingNode = null;
        this.TracingStructure = null;
    }

    BrainArea: ISearchBrainAreaTable;
    Neuron: ISearchNeuronTable;
    SearchContent: ISearchContentTable;
    StructureIdentifier: ISearchStructureIdentifierTable;
    Tracing: ISearchTracingTable;
    TracingNode: ISearchTracingNodeTable;
    TracingStructure: ISearchTracingStructureTable;
}

export interface ISequelizeDatabase<T> {
    connection: any;
    tables: T;
    isConnected: boolean;
}

export class PersistentStorageManager {
    private _isInitialized = false;

    public static Instance(): PersistentStorageManager {
        return _manager;
    }

    public get Sample(): ISampleDatabaseModels {
        return this.sampleDatabase.tables;
    }

    public get Swc(): ISwcDatabaseModels {
        return this.swcDatabase.tables;
    }

    public get Transform(): ITransformDatabaseModels {
        return this.transformDatabase.tables;
    }
    public get Search(): SearchTables {
        return this.searchDatabase.tables;
    }

    public async initialize() {
        await authenticate(this.sampleDatabase, "sample");
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

    private sampleDatabase: ISequelizeDatabase<ISampleDatabaseModels> = createConnection("sample", {});
    private swcDatabase: ISequelizeDatabase<ISwcDatabaseModels> = createConnection("swc", {});
    private transformDatabase: ISequelizeDatabase<ITransformDatabaseModels> = createConnection("transform", {});
    private searchDatabase: ISequelizeDatabase<SearchTables> = createConnection("search", new SearchTables());
}

async function authenticate(database, name) {
    try {
        await database.connection.authenticate();

        database.isConnected = true;

        debug(`successful database connection: ${name}`);

        if (name === "swc") {
            Object.keys(database.tables).forEach(modelName => {
                if (database.tables[modelName].prepareContents) {
                    database.tables[modelName].prepareContents(database.tables);
                }
            });
        }
    } catch (err) {
        debug(`failed database connection: ${name}`);
        debug(err);
        setTimeout(() => authenticate(database, name), 5000);
    }
}

function createConnection<T>(name: string, models: T) {
    let databaseConfig = DatabaseOptions[name];

    let db: ISequelizeDatabase<T> = {
        connection: null,
        tables: models,
        isConnected: false
    };

    debug(`initiating connection: ${databaseConfig.host}:${databaseConfig.port}#${databaseConfig.database}`);

    db.connection = new Sequelize(databaseConfig.database, databaseConfig.username, databaseConfig.password, databaseConfig);

    return loadModels(db, __dirname + "/" + name);
}

const _manager: PersistentStorageManager = new PersistentStorageManager();

_manager.initialize().then(() => {
});
