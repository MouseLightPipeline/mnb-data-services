import {execSync} from "child_process";

const fs = require("fs-extra");
const path = require("path");
const exec = require("child_process").exec;
const moment = require("moment");

const debug = require("debug")("mnb:data:backup");

import {DatabaseOptions} from "../options/databaseOptions";
import {ServiceOptions} from "../options/serviceOptions";

const args = process.argv.slice(2);

if (args.length < 1) {
    debug(`target database not specified (sample, swc, transform, or search)`);
    process.exit(1);
}

const outputLoc = ServiceOptions.backupPath;

const databaseName = process.argv[2];

const options = DatabaseOptions[databaseName];

debug(`performing backup for database '${options.database}'.`);

const now = new Date();

const m = moment(now);

const timestamp = m.format("YYYY-MM-DD_hh-mm-ss");

const outputFullPath = path.join(outputLoc, databaseName);

if (!fs.existsSync(outputFullPath) && !fs.ensureDirSync(outputFullPath)) {
    debug(`output location ${outputFullPath} could not be created`);
    process.exit(1);
}

const outputFile = path.join(outputFullPath, `${databaseName}_${timestamp}.pg.gz`).split(" ").join("\\ ");

const exec_str = `pg_dump -h ${options.host} -p ${options.port} -U ${options.username} ${options.database} | gzip > ${outputFile}`;

debug(`performing ${exec_str}`);

execSync(exec_str);

debug(`done`);