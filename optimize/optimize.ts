const debug = require("debug")("mnb:data:search:generate-contents");

import {RemoteDatabaseClient} from "../models/remoteDatabaseClient";
import {DatabaseOptions} from "../options/databaseOptions";
import {SearchOptimization, ShareVisibility} from "./SearchOptimization";

const minVisibility = process.argv.length > 2 ? parseInt(process.argv[2]) : ShareVisibility.DoNotShare;

debug(`using min visibility level of ${minVisibility}`);

const forceUpdate = process.argv.length > 3 ? parseInt(process.argv[3]) !== 0 : false;

optimize().then((success: boolean) => {
    debug(`translation complete ${success ? "successfully" : "with error"}`);

    process.exit(0);
});

async function optimize() : Promise<boolean> {
    await RemoteDatabaseClient.Start("sample", DatabaseOptions.sample);
    await RemoteDatabaseClient.Start("swc", DatabaseOptions.swc);
    await RemoteDatabaseClient.Start("transform", DatabaseOptions.transform);
    await RemoteDatabaseClient.Start("search", DatabaseOptions.search);

    return SearchOptimization.optimize(minVisibility, forceUpdate);
}
