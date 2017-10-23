import * as path from "path";
import {migrate, seed} from "ndb-data-models";

import {generateContents} from "./src/generateContents";
import {DatabaseOptions} from "./src/options/databaseOptions";

if (process.argv.length > 2) {
    switch (process.argv[2]) {
        case "migrate":
            migrateTransform();
            break;
        case "seed":
            seedTransform();
            break;
        case "generate":
            generateContents();
            break;
    }
}

export async function migrateTransform() {
    await migrate(DatabaseOptions.search, path.normalize("./migrations"));
}

export async function seedTransform() {
    await seed(DatabaseOptions.search, path.normalize(path.join(__dirname, "seeders")));
}
