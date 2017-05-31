import * as path from "path";

import {migrateSampleDatabase, seed} from "ndb-data-models";
import {Databases} from "./options/databaseOptions";

if (process.argv.length > 2) {
    switch (process.argv[2]) {
        case "migrate":
            migrateSample().then(()=>{});
            break;
        case "seed":
            seedSample().then(()=>{});
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

    databaseOptions.password = process.env.DATABASE_PW || "pgsecret";

    databaseOptions.host = process.env.DATABASE_HOST || databaseOptions.host;
    databaseOptions.port = process.env.DATABASE_PORT || databaseOptions.port;

    return databaseOptions;
}
