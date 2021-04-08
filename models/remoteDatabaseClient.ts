import * as path from "path";
import * as fs from "fs";
import {Sequelize, Options} from "sequelize";

const debug = require("debug")("mnb:data-services:remoteDatabaseClient");

export class RemoteDatabaseClient {
    public static async Start(name: string, options: Options): Promise<RemoteDatabaseClient> {
        const client = new RemoteDatabaseClient(options);
        await client.start(name);
        return client;
    }

    private _connection: Sequelize;
    private readonly _options: Options;

    private constructor(options: Options) {
        this._options = options;
    }

    private async start(name: string) {
        this.createConnection(name, this._options);
        await this.authenticate(name);
    }

    private createConnection(name: string, options: Options) {
        this._connection = new Sequelize(options.database, options.username, options.password, options);

        this.loadModels(path.normalize(path.join(__dirname, "..", "models", name)));
    }

    private async authenticate(name: string) {
        try {
            await this._connection.authenticate();

            debug(`successful database connection: ${name}`);

        } catch (err) {
            if (err.name === "SequelizeConnectionRefusedError") {
                debug(`failed database connection: ${name} (connection refused - is it running?) - delaying 5 seconds`);
            } else {
                debug(`failed database connection: ${name} - delaying 5 seconds`);
                debug(err);
            }

            setTimeout(() => this.authenticate(name), 5000);
        }
    }

    private loadModels(modelLocation: string) {
        const modules = [];

        fs.readdirSync(modelLocation).filter(file => {
            return (file.indexOf(".") !== 0) && (file.slice(-3) === ".js");
        }).forEach(file => {
            let modelModule = require(path.join(modelLocation, file.slice(0, -3)));

            if (modelModule.modelInit != null) {
                modelModule.modelInit(this._connection);
                modules.push(modelModule);
            }
        });

        modules.forEach(modelModule => {
            if (modelModule.modelAssociate != null) {
                modelModule.modelAssociate();
            }
        });
    }
}
