export const Databases = {
    sample: {
        database: "samples_production",
        username: "postgres",
        password: null,
        host: "sample-db",
        port: 5432,
        dialect: "postgres",
        logging: null
    },
    swc: {
        database: "swc_production",
        username: "postgres",
        password: null,
        host: "swc-db",
        port: 5432,
        dialect: "postgres",
        logging: null
    },
    transform: {
        database: "transform_production",
        username: "postgres",
        password: null,
        host: "transform-db",
        port: 5432,
        dialect: "postgres",
        logging: null

    },
    search: {
        database: "search_production",
        username: "postgres",
        password: null,
        host: "search-db",
        port: 5432,
        dialect: "postgres",
        logging: null
    }
};

const defaultPassword = "pgsecret";

export const DatabaseOptions = loadConfiguration();

function loadConfiguration() {

    const databaseOptions= Object.assign({}, Databases);

    databaseOptions.sample.host = process.env.SAMPLE_DB_HOST || databaseOptions.sample.host;
    databaseOptions.sample.port = process.env.SAMPLE_DB_PORT || databaseOptions.sample.port;
    databaseOptions.sample.password = process.env.DATABASE_PW || defaultPassword;

    databaseOptions.swc.host = process.env.SWC_DB_HOST || databaseOptions.swc.host;
    databaseOptions.swc.port = process.env.SWC_DB_PORT || databaseOptions.swc.port;
    databaseOptions.swc.password = process.env.DATABASE_PW || defaultPassword;

    databaseOptions.transform.host = process.env.TRANSFORM_DB_HOST || databaseOptions.transform.host;
    databaseOptions.transform.port = process.env.TRANSFORM_DB_PORT || databaseOptions.transform.port;
    databaseOptions.transform.password = process.env.DATABASE_PW || defaultPassword;

    databaseOptions.search.host = process.env.SEARCH_DB_HOST || databaseOptions.search.host;
    databaseOptions.search.port = process.env.SEARCH_DB_PORT || databaseOptions.search.port;
    databaseOptions.search.password = process.env.DATABASE_PW || defaultPassword;

    return databaseOptions;
}
