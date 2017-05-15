export interface IConnectionOptions {
    host: string;
    port: number;
}

export interface IDatabases<T> {
    influx: IDatabaseEnv<T>;
}

export interface IDatabaseEnv<T> {
    development: T;
    test: T;
    production: T;
}

export const Databases: IDatabases<IConnectionOptions> = {
    influx: {
        development: {
            host: "metrics-db",
            port: 8086
        },
        test: {
            host: "metrics-db",
            port: 8086
        },
        production: {
            host: "metrics-db",
            port: 8086
        }
    }
};
