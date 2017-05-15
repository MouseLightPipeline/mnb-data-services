import {IConnectionOptions} from "ndb-data-models";

export interface IDatabases<T> {
    sample: IDatabaseEnv<T>;
}

export interface IDatabaseEnv<T> {
    development: T;
    test: T;
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
        test: {
            database: "samples_test",
            username: "postgres",
            host: "sample-db",
            port: 5432,
            dialect: "postgres",
            logging: null
        },
        azure: {
            database: "jrcndb",
            username: "j4n3lia",
            host: "janeliandb.database.windows.net",
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
    }
};
