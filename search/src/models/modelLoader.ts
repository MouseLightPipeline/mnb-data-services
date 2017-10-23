const fs = require("fs");
const path = require("path");

import {ISequelizeDatabase} from "./databaseConnector";

export function loadModels<T>(db: ISequelizeDatabase<T>, modelLocation: string) {
    fs.readdirSync(modelLocation).filter(file => {
        return (file.indexOf(".") !== 0) && (file.slice(-3) === ".js");
    }).forEach(file => {
        let modelModule = require(path.join(modelLocation, file));

        const model = db.connection.import(modelModule.TableName, modelModule.sequelizeImport);

        db.models[model.name] = model;
    });

    Object.keys(db.models).forEach(modelName => {
        if (db.models[modelName].associate) {
            db.models[modelName].associate(db.models);
        }
    });

    return db;
}
