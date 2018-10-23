const fs = require("fs-extra");
const path = require("path");
const exec = require("child_process").exec;
const moment = require("moment");

import {DatabaseOptions} from "../options/databaseOptions";
import {ServiceOptions} from "../options/serviceOptions";

const args = process.argv.slice(2);

if (args.length < 1) {
    console.error(`target database not specified (sample, swc, transform, or search)`);
    process.exit(1);
}

const outputLoc = ServiceOptions.backupPath;

const databaseName = process.argv[2];

const options = DatabaseOptions[databaseName];

console.log(`Performing backup for database '${options.database}'.`);

const now = new Date();

const m = moment(now);

const timestamp = m.format("YYYY-MM-DD_hh-mm-ss");

const outputFullPath = path.join(outputLoc, databaseName);

if (!fs.existsSync(outputFullPath) && !fs.ensureDirSync(outputFullPath)) {
    console.error(`output location ${outputFullPath} could not be created`);
    process.exit(1);
}

const outputFile = path.join(outputFullPath, `${databaseName}_${timestamp}.pg.gz`);

const exec_str = `pg_dump -h ${options.host} -p ${options.port} -U ${options.username} ${options.database} | gzip > ${outputFile}`;

console.log(`performing ${exec_str}`);

exec(exec_str, (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }

    console.log(stdout);
    console.log(stderr);
});
