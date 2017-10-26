import {IConnectionOptions} from "ndb-data-models";

interface IDatabases<T> {
    sample: IDatabaseEnv<T>;
    swc: IDatabaseEnv<T>;
    transform: IDatabaseEnv<T>;
    search: IDatabaseEnv<T>;
}

interface IDatabaseEnv<T> {
    development: T;
    azure: T;
    production: T;
}

export const Databases: IDatabases<IConnectionOptions> = {
    sample: {
        development: {
            database: "samples_development",
            username: "postgres",
            host: "sample-db",
            port: 5432,
            dialect: "postgres",
            logging: null
        },
        azure: {
            database: "jrcndb",
            username: "JaNEadmin",
            password: "",
            host: "jrcndb.database.windows.net",
            dialect: "mssql",
            dialectOptions: {
                encrypt: true,
                requestTimeout: 60000
            },
            logging: null
        },
        production: {
            database: "samples_production",
            username: "postgres",
            host: "sample-db",
            port: 5432,
            dialect: "postgres",
            logging: null
        }
    },
    swc: {
        development: {
            database: "swc_development",
            username: "postgres",
            host: "swc-db",
            port: 5433,
            dialect: "postgres",
            logging: null
        },
        azure: {
            database: "jrcndb",
            username: "JaNEadmin",
            password: "",
            host: "jrcndb.database.windows.net",
            dialect: "mssql",
            dialectOptions: {
                encrypt: true,
                requestTimeout: 60000
            },
            logging: null
        },
        production: {
            database: "swc_production",
            username: "postgres",
            host: "swc-db",
            port: 5432,
            dialect: "postgres",
            logging: null
        }
    },
    transform: {
        development: {
            database: "transform_development",
            username: "postgres",
            host: "transform-db",
            port: 5434,
            dialect: "postgres",
            logging: null
        },
        azure: {
            database: "jrcndb",
            username: "JaNEadmin",
            password: "",
            host: "jrcndb.database.windows.net",
            dialect: "mssql",
            dialectOptions: {
                encrypt: true,
                requestTimeout: 60000
            },
            logging: null
        },
        production: {
            database: "transform_production",
            username: "postgres",
            host: "transform-db",
            port: 5432,
            dialect: "postgres",
            logging: null
        }
    },
    search: {
        development: {
            database: "search_development",
            username: "postgres",
            host: "search-db",
            port: 5432,
            dialect: "postgres",
            logging: null
        },
        azure: {
            database: "jrcndb",
            username: "JaNEadmin",
            password: "",
            host: "jrcndb.database.windows.net",
            dialect: "mssql",
            dialectOptions: {
                encrypt: true,
                requestTimeout: 60000
            },
            logging: null
        },
        production: {
            database: "search_production",
            username: "postgres",
            host: "search-db",
            port: 5432,
            dialect: "postgres",
            logging: null
        }
    }
};

export const DatabaseOptions = loadConfiguration();

function loadConfiguration() {
    const envName = process.env.NODE_ENV || "development";

    const dbEnvName = process.env.DATABASE_ENV || envName;

    const databaseOptions: any = {};

    databaseOptions.sample = Databases.sample[dbEnvName];
    databaseOptions.sample.host = process.env.SAMPLE_DB_HOST || process.env.DATABASE_HOST || databaseOptions.sample.host;
    databaseOptions.sample.port = process.env.SAMPLE_DB_PORT || process.env.DATABASE_HOST || databaseOptions.sample.port;
    databaseOptions.sample.password = process.env.DATABASE_PW || "pgsecret";

    databaseOptions.swc = Databases.swc[dbEnvName];
    databaseOptions.swc.host = process.env.SWC_DB_HOST || process.env.DATABASE_HOST || databaseOptions.swc.host;
    databaseOptions.swc.port = process.env.SWC_DB_PORT || process.env.DATABASE_HOST || databaseOptions.swc.port;
    databaseOptions.swc.password = process.env.DATABASE_PW || "pgsecret";

    databaseOptions.transform = Databases.transform[dbEnvName];
    databaseOptions.transform.host = process.env.TRANSFORM_DB_HOST || process.env.DATABASE_HOST || databaseOptions.transform.host;
    databaseOptions.transform.port = process.env.TRANSFORM_DB_PORT || process.env.DATABASE_HOST || databaseOptions.transform.port;
    databaseOptions.transform.password = process.env.DATABASE_PW || "pgsecret";

    databaseOptions.search = Databases.search[dbEnvName];
    databaseOptions.search.host = process.env.SEARCH_DB_HOST || process.env.DATABASE_HOST || databaseOptions.search.host;
    databaseOptions.search.port = process.env.SEARCH_DB_PORT || process.env.DATABASE_HOST || databaseOptions.search.port;
    databaseOptions.search.password = process.env.DATABASE_PW || "pgsecret";

    return databaseOptions;

}
