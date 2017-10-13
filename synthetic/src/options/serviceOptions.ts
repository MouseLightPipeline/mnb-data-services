import {IConnectionOptions} from "ndb-data-models";

import {Databases} from "./databaseOptions";

export interface IServerOptions {
    port: number;
    graphQlEndpoint: string;
    graphiQlEndpoint: string;
}


export interface IDataBaseOptions {
    sample: IConnectionOptions;
    swc: IConnectionOptions;
    transform: IConnectionOptions;
    metrics: IConnectionOptions;
}

export interface IServiceOptions {
    envName: string;
    ontologyPath: string;
    serverOptions: IServerOptions;
    databaseOptions: IDataBaseOptions;
}

interface IConfiguration<T> {
    development: T;
    test: T;
    production: T;
}

const configurations: IConfiguration<IServiceOptions> = {
    development: {
        envName: "",
        ontologyPath: "/Volumes/Spare/Projects/Neuron Data Browser/registration/Allen Atlas/OntologyAtlas.h5",
        serverOptions: {
            port: 9661,
            graphQlEndpoint: "/graphql",
            graphiQlEndpoint: "/graphiql"
        },
        databaseOptions: {
            sample: null,
            swc: null,
            transform: null,
            metrics: null
        }
    },
    test: {
        envName: "",
        ontologyPath: "/groups/mousebrainmicro/mousebrainmicro/registration/Allen Atlas/OntologyAtlas.h5",
        serverOptions: {
            port: 9661,
            graphQlEndpoint: "/graphql",
            graphiQlEndpoint: "/graphiql"
        },
        databaseOptions: {
            sample: null,
            swc: null,
            transform: null,
            metrics: null
        }
    },
    production: {
        envName: "",
        ontologyPath: "/groups/mousebrainmicro/mousebrainmicro/registration/Allen Atlas/OntologyAtlas.h5",
        serverOptions: {
            port: 9661,
            graphQlEndpoint: "/graphql",
            graphiQlEndpoint: "/graphiql"
        },
        databaseOptions: {
            sample: null,
            swc: null,
            transform: null,
            metrics: null
        }
    }
};

function loadConfiguration(): IServiceOptions {
    const envName = process.env.NODE_ENV || "development";

    const c = configurations[envName];

    c.envName = envName;

    c.ontologyPath = process.env.ONTOLOGY_PATH || c.ontologyPath;

    const dbEnvName = process.env.DATABASE_ENV || envName;

    c.databaseOptions.sample = Databases.sample[dbEnvName];
    c.databaseOptions.sample.host = process.env.SAMPLE_DB_HOST || c.databaseOptions.sample.host;
    c.databaseOptions.sample.port = process.env.SAMPLE_DB_PORT || c.databaseOptions.sample.port;
    c.databaseOptions.sample.password = process.env.DATABASE_PW || "pgsecret";

    c.databaseOptions.swc = Databases.swc[dbEnvName];
    c.databaseOptions.swc.host = process.env.SWC_DB_HOST || c.databaseOptions.swc.host;
    c.databaseOptions.swc.port = process.env.SWC_DB_PORT || c.databaseOptions.swc.port;
    c.databaseOptions.swc.password = process.env.DATABASE_PW || "pgsecret";

    c.databaseOptions.transform = Databases.transform[dbEnvName];
    c.databaseOptions.transform.host = process.env.TRANSFORM_DB_HOST || c.databaseOptions.transform.host;
    c.databaseOptions.transform.port = process.env.TRANSFORM_DB_PORT || c.databaseOptions.transform.port;
    c.databaseOptions.transform.password = process.env.DATABASE_PW || "pgsecret";

    return c;
}

export const ServiceOptions: IServiceOptions = loadConfiguration();

export const DatabaseOptions: IDataBaseOptions = ServiceOptions.databaseOptions;
