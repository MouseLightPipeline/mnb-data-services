import * as yargs from "yargs";
import {hideBin} from "yargs/helpers";

const debug = require("debug")("mnb:data:search:generate-contents");

import {RemoteDatabaseClient} from "../models/remoteDatabaseClient";
import {DatabaseOptions} from "../options/databaseOptions";
import {SearchOptimization, ShareVisibility} from "./SearchOptimization";

const argv = yargs(hideBin(process.argv))
    .options({
        visibility: {type: "number", default: ShareVisibility.DoNotShare, conflicts: "neuron"},
        forceUpdate: {type: "boolean", default: false},
        neuron: {type: "string", conflicts: "visibility"}
    }).argv;

debug(`using minimum visibility level of ${argv.visibility}`);

optimize().then((success: boolean) => {
    debug(`translation complete ${success ? "successfully" : "with error"}`);

    process.exit(0);
});

async function optimize(): Promise<boolean> {
    await RemoteDatabaseClient.Start("sample", DatabaseOptions.sample);
    await RemoteDatabaseClient.Start("swc", DatabaseOptions.swc);
    await RemoteDatabaseClient.Start("transform", DatabaseOptions.transform);
    await RemoteDatabaseClient.Start("search", DatabaseOptions.search);

    return SearchOptimization.optimize(argv.visibility, argv.forceUpdate);
}
