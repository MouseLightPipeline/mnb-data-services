import {Dialect} from "sequelize";

export const Databases = {
    sample: {
        database: "samples_production",
        username: "postgres",
        password: null,
        host: "sample-db",
        port: 5432,
        dialect: "postgres" as Dialect,
        logging: null
    },
    swc: {
        database: "swc_production",
        username: "postgres",
        password: null,
        host: "swc-db",
        port: 5432,
        dialect: "postgres" as Dialect,
        logging: null
    },
    transform: {
        database: "transform_production",
        username: "postgres",
        password: null,
        host: "transform-db",
        port: 5432,
        dialect: "postgres" as Dialect,
        logging: null
    },
    search: {
        database: "search_production",
        username: "postgres",
        password: null,
        host: "search-db",
        port: 5432,
        dialect: "postgres" as Dialect,
        logging: null
    }
};

export const DatabaseOptions = loadConfiguration();

function loadConfiguration() {

    const databaseOptions = Object.assign({}, Databases);

    databaseOptions.sample.host = process.env.SAMPLE_DB_HOST || process.env.DATABASE_HOST || databaseOptions.sample.host;
    databaseOptions.sample.port = parseInt(process.env.SAMPLE_DB_PORT) || parseInt(process.env.DATABASE_PORT) || databaseOptions.sample.port;
    databaseOptions.sample.password = process.env.DATABASE_PW || "pgsecret";

    databaseOptions.swc.host = process.env.SWC_DB_HOST || process.env.DATABASE_HOST || databaseOptions.swc.host;
    databaseOptions.swc.port = parseInt(process.env.SWC_DB_PORT) || parseInt(process.env.DATABASE_PORT) || databaseOptions.swc.port;
    databaseOptions.swc.password = process.env.DATABASE_PW || "pgsecret";

    databaseOptions.transform.host = process.env.TRANSFORM_DB_HOST || process.env.DATABASE_HOST || databaseOptions.transform.host;
    databaseOptions.transform.port = parseInt(process.env.TRANSFORM_DB_PORT) || parseInt(process.env.DATABASE_PORT) || databaseOptions.transform.port;
    databaseOptions.transform.password = process.env.DATABASE_PW || "pgsecret";

    databaseOptions.search.host = process.env.SEARCH_DB_HOST || process.env.DATABASE_HOST || databaseOptions.search.host;
    databaseOptions.search.port = parseInt(process.env.SEARCH_DB_PORT) || parseInt(process.env.DATABASE_PORT) || databaseOptions.search.port;
    databaseOptions.search.password = process.env.DATABASE_PW || "pgsecret";

    return databaseOptions;
}
