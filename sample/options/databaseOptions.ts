import {IConnectionOptions} from "ndb-data-models";

export interface IDatabases {
    sample: IDatabaseEnv;
}

export interface IDatabaseEnv {
    development: IConnectionOptions;
    test: IConnectionOptions;
    azure: IConnectionOptions;
    production: IConnectionOptions;

    [name: string]: any;
}

export const Databases: IDatabases = {
    sample: {
        development: {
            database: "samples_development",
            username: "postgres",
            password: "",
            host: "localhost",
            port: 5432,
            dialect: "postgres",
            logging: null
        },
        test: {
            database: "samples_test",
            username: "postgres",
            password: "",
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
            password: "",
            host: "sample-db",
            port: 5432,
            dialect: "postgres",
            logging: null
        }
    }
};
