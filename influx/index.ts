import {Databases} from "./options/databaseOptions";

const Influx = require("influx");

const options = loadOptions();

if (options) {
    migrateDatabase().then(() => {
        console.log("Influx databases created");
    }).catch(err => {
        console.error(`error creating Influx database`);
        console.error(err);
    });
}

async function migrateDatabase() {
    if (options) {
        const influx = new Influx.InfluxDB({
            host: options.host,
            port: options.port
        });

        const names = await influx.getDatabaseNames();

        if (!names.includes("query_metrics_db")) {
            await influx.createDatabase("query_metrics_db");
        }

        if (!names.includes("export_metrics_db")) {
            await influx.createDatabase("export_metrics_db");
        }
    }
}

function loadOptions() {
    const envName = process.env.NODE_ENV || "development";

    const dbEnvName = process.env.DATABASE_ENV || envName;

    if (Databases.influx[dbEnvName]) {
        const databaseOptions = Databases.influx[dbEnvName];

        databaseOptions.host = process.env.METRICS_DB_HOST || process.env.DATABASE_HOST || databaseOptions.host;
        databaseOptions.port = process.env.METRICS_DB_PORT || process.env.DATABASE_PORT || databaseOptions.port;

        return databaseOptions;
    } else {
        return null;
    }
}
