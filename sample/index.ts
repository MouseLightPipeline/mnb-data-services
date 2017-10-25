import * as fs from "fs";
import * as path from "path";
const csv = require("csv");

import {migrateSampleDatabase, SampleConnector, seed} from "ndb-data-models";
import {Databases} from "./options/databaseOptions";
import {isNullOrUndefined} from "util";

if (process.argv.length > 2) {
    switch (process.argv[2]) {
        case "migrate":
            migrateSample().then(() => {
            });
            break;
        case "seed":
            seedSample().then(() => {
            });
            break;
        case "doi":
            loadDOI().then(() => {
            });
            break;
    }
}

export async function migrateSample() {
    await migrateSampleDatabase(loadConfiguration());
}

export async function seedSample() {
    await seed(loadConfiguration(), path.normalize(path.join(__dirname, "seeders")));
}

function loadConfiguration() {
    const envName = process.env.NODE_ENV || "development";

    const dbEnvName = process.env.DATABASE_ENV || envName;

    const databaseOptions = Databases.sample[dbEnvName];

    const password = process.env.DATABASE_PW || "pgsecret";

    if (!isNullOrUndefined(databaseOptions.password)) {
        databaseOptions.password = password;
    }

    databaseOptions.host =  process.env.SAMPLE_DB_HOST || process.env.DATABASE_HOST || databaseOptions.host;

    databaseOptions.port = process.env.SAMPLE_DB_PORT || databaseOptions.port;

    if (databaseOptions.uri) {
        databaseOptions.uri = databaseOptions.uri.replace("{your_password}", password);
    }

    return databaseOptions;
}

async function loadDOI() {
    const connector = new SampleConnector(loadConfiguration());

    await connector.authenticate();

    const filename = path.resolve(path.join(__dirname, "./mouselight_neuron_doi.csv"));

    const data = fs.readFileSync(filename);

    await csv.parse(data, async (err: any, data: any) => {
        await data.map(async (line: any) => {
            const neuron = await connector.models.Neuron.findOne({where: {idString: line[0]}});

            if (neuron) {
                await neuron.update({doi: line[1]});
                console.log(`${neuron.idString}: ${neuron.doi}`);
            } else {
                console.log(`${line[0]} no entry for this neuron`);
            }
        });
    });
}
