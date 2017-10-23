import {IConnectionOptions} from "ndb-data-models";

export interface IDatabases<T> {
    swc: IDatabaseEnv<T>;
}

export interface IDatabaseEnv<T> {
    development: T;
    test: T;
    azure: T;
    production: T;
}

export const Databases: IDatabases<IConnectionOptions> = {
    swc: {
        development: {
            database: "swc_development",
            username: "postgres",
            host: "swc-db",
            port: 5432,
            dialect: "postgres",
            logging: null
        },
        test: {
            database: "swc_test",
            username: "postgres",
            host: "swc-db",
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
            database: "swc_production",
            username: "postgres",
            host: "swc-db",
            port: 5432,
            dialect: "postgres",
            logging: null
        }
    }
};

