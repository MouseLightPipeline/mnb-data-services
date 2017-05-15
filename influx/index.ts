import {Databases} from "./options/databaseOptions";
const Influx = require('influx');

const options = loadOptions();

if (options) {
    const databaseName = 'query_metrics_db';

    const influx = new Influx.InfluxDB({
        host: options.host,
        port: options.port,
        database: databaseName,
        schema: [
            {
                measurement: 'query_response_times',
                fields: {
                    queryObject: Influx.FieldType.STRING,
                    querySql: Influx.FieldType.STRING,
                    errors: Influx.FieldType.STRING,
                    duration: Influx.FieldType.INTEGER
                },
                tags: [
                    'user'
                ]
            }
        ]
    });

    influx.getDatabaseNames()
    .then(names => {
        if (!names.includes(databaseName)) {
            return influx.createDatabase(databaseName);
        }
    })
    .then(() => {
        console.log('databases updated');
    })
    .catch(err => {
        console.error(`error creating Influx database`);
        console.error(err);
    });
}

function loadOptions() {
    const envName = process.env.NODE_ENV || "development";

    const dbEnvName = process.env.DATABASE_ENV || envName;

    if (Databases.influx[dbEnvName]) {
        const databaseOptions = Databases.influx[dbEnvName];

        databaseOptions.host = process.env.DATABASE_HOST || databaseOptions.host;
        databaseOptions.port = process.env.DATABASE_PORT || databaseOptions.port;

        return databaseOptions;
    } else {
        return null;
    }
}
