const fs = require("fs-extra");
const path = require("path");
const exec = require("child_process").exec;
const moment = require("moment");

const env = process.env.NODE_ENV || "development";

const configFile = process.argv[2];
const outputLoc = process.argv[3];
const outputBase = process.argv[4];

const config = require(configFile)[env];

const now = new Date();

const m = moment(now);

const timestamp = m.format("YYYY-MM-DD_hh-mm-ss");

const outputFullPath = path.join(outputLoc, outputBase);

if (!fs.existsSync(outputFullPath) && !fs.ensureDirSync(outputFullPath)) {
    console.error(`output location ${outputFullPath} could not be created`);
    process.exit(1);
}

const outputFile = path.join(outputFullPath, `${env}_${timestamp}.pg.gz`);

const exec_str = `pg_dumpall -h ${config.host} -p ${config.port} -U ${config.username} | gzip > ${outputFile}`;

console.log(`performing ${exec_str}`);

exec(exec_str, (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }

    console.log(stdout);
    console.log(stderr);
});
