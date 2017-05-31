import {IConnectionOptions} from "ndb-data-models";

export interface IDatabases<T> {
    transform: IDatabaseEnv<T>;
}

export interface IDatabaseEnv<T> {
    development: T;
    test: T;
    azure: T;
    production: T;
}

export const Databases: IDatabases<IConnectionOptions> = {
    transform: {
        development: {
            database: "transform_development",
            username: "postgres",
            host: "localhost",
            port: 5432,
            dialect: "postgres",
            logging: null
        },
        test: {
            database: "transform_test",
            username: "postgres",
            host: "transform-db",
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
            database: "transform_production",
            username: "postgres",
            host: "transform-db",
            port: 5432,
            dialect: "postgres",
            logging: null
        }
    }
};

