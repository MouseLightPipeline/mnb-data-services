const fs = require("fs-extra");
const path = require("path");
const exec = require("child_process").exec;
const moment = require("moment");

const optionsFile = process.argv[2];
const outputLoc = process.argv[3];
const outputBase = process.argv[4];

const options = loadConfiguration(optionsFile, outputBase);

console.log(`Performing backup using environment '${options.envName}' for database '${outputBase}' using dbEnv '${options.dbEnvName}'.`);

const now = new Date();

const m = moment(now);

const timestamp = m.format("YYYY-MM-DD_hh-mm-ss");

const outputFullPath = path.join(outputLoc, outputBase);

if (!fs.existsSync(outputFullPath) && !fs.ensureDirSync(outputFullPath)) {
    console.error(`output location ${outputFullPath} could not be created`);
    process.exit(1);
}

const outputFile = path.join(outputFullPath, `${options.envName}_${timestamp}.pg.gz`);

const exec_str = `pg_dumpall -h ${options.host} -p ${options.port} -U ${options.username} | gzip > ${outputFile}`;

console.log(`performing ${exec_str}`);

exec(exec_str, (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }

    console.log(stdout);
    console.log(stderr);
});

function loadConfiguration(optionsFile, database) {
    const DatabasesFile = require(optionsFile);

    const envName = process.env.NODE_ENV || "development";

    const dbEnvName = process.env.DATABASE_ENV || envName;

    const databaseOptions = DatabasesFile.Databases[database][dbEnvName];

    databaseOptions.password = process.env.DATABASE_PW || "pgsecret";
    databaseOptions.envName = envName;
    databaseOptions.dbEnvName = dbEnvName;

    databaseOptions.host = process.env.DATABASE_HOST || databaseOptions.host;
    databaseOptions.port = process.env.DATABASE_PORT || databaseOptions.port;

    return databaseOptions;
}
