const Influx = require('influx');

const env = process.env.NODE_ENV || "development";
const config = require('./config.json')[env];

const databaseName = 'query_metrics_db';

const influx = new Influx.InfluxDB({
    host: config.host,
    port: config.port,
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
