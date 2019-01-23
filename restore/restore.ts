import * as fs from "fs-extra";
import * as path from "path";
import {exec, execSync} from "child_process";

const debug = require("debug")("mnb:data:restore");

import {DatabaseOptions} from "../options/databaseOptions";
import {ServiceOptions} from "../options/serviceOptions";

const args = process.argv.slice(2);

performRestore(args).then(() => debug("complete"));

async function performRestore(args: string[]) {
    if (args.length < 1) {
        debug(`target database not specified (sample, swc, transform, or search)`);
        process.exit(1);
    }

    const inputPath = ServiceOptions.restorePath;

    if (!fs.existsSync(inputPath)) {
        debug(`restore location ${inputPath} does not exist`);
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
        debug(`restore file not found for ${databaseName}`);
        process.exit(1);
    }

    const options = DatabaseOptions[databaseName];

    const inputFilePath = path.join(inputPath, inputFile).split(" ").join("\\ ");

    debug(`performing restore for database '${databaseName}' from ${inputFilePath}`);

    await performSqlCommand(options, "DROP SCHEMA public CASCADE;");

    await performSqlCommand(options, "CREATE SCHEMA public;");

    await performSqlCommand(options, "GRANT ALL ON SCHEMA public TO postgres;");

    await performSqlCommand(options, "GRANT ALL ON SCHEMA public TO public;");

    const exec_str = `psql -h ${options.host} -p ${options.port} -U ${options.username} -d ${options.database} -f ${inputFilePath}`;

    debug(`performing ${exec_str}`);

    try {
        await new Promise((resolve, reject) => exec(exec_str, (error, stderr, stdout) => {
            if (error) {
                debug(error.message);
                reject();
            }

            debug(stdout);
            debug(stderr);

            resolve();
        }));
    } catch {
    }
}

async function performSqlCommand(options, command: string) {
    const drop_str = `psql -h ${options.host} -p ${options.port} -U ${options.username} -d ${options.database} -c "${command}"`;

    try {
        await new Promise((resolve, reject) => exec(drop_str, (error, stdout) => {
            if (error) {
                debug(error.message);
                reject();
            }

            debug(stdout);

            resolve();
        }));
    } catch {
    }
}
