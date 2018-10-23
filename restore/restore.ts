import * as fs from "fs-extra";
import * as path from "path";
import {exec} from "child_process";

import {DatabaseOptions} from "../options/databaseOptions";
import {ServiceOptions} from "../options/serviceOptions";

const args = process.argv.slice(2);

if (args.length < 1) {
    console.error(`target database not specified (sample, swc, transform, or search)`);
    process.exit(1);
}

const inputPath = ServiceOptions.restorePath;

if (!fs.existsSync(inputPath)) {
    console.error(`restore location ${inputPath} does not exist`);
    process.exit(1);
}

const databaseName = process.argv[2];

let inputFile = null;

const files = fs.readdirSync(inputPath);

files.some((f) => {
    if (f.startsWith(`${databaseName}_`) && f.endsWith(".pg")) {
        inputFile = f;
        return true;
    }
    return false;
});

if (inputFile === null) {
    console.error(`restore file not found for ${databaseName}`);
    process.exit(1);
}

const options = DatabaseOptions[databaseName];

const inputFilePath = path.join(inputPath, inputFile);

console.log(`Performing restore for database '${databaseName}' from ${inputFilePath}`);

const exec_str = `psql -h ${options.host} -p ${options.port} -U ${options.username} -d ${options.database} -f ${inputFilePath}`;

console.log(`performing ${exec_str}`);

exec(exec_str, (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }

    console.log(stdout);
    console.log(stderr);
});
