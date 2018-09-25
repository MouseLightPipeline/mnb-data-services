export const Databases = {
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
