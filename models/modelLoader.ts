const fs = require("fs");
const path = require("path");

import {ISequelizeDatabase} from "./persistentStorageManager";

export function loadModels<T>(db: ISequelizeDatabase<T>, modelLocation: string) {
    fs.readdirSync(modelLocation).filter(file => {
        return (file.indexOf(".") !== 0) && (file.slice(-3) === ".js");
    }).forEach(file => {
        let tableModule = require(path.join(modelLocation, file));

        if (tableModule.TableName !== undefined && tableModule.sequelizeImport !== undefined) {
            const table = db.connection.import(tableModule.TableName, tableModule.sequelizeImport);

            db.tables[table.name] = table;
        }
    });

    Object.keys(db.tables).forEach(modelName => {
        if (db.tables[modelName].associate) {
            db.tables[modelName].associate(db.tables);
        }
    });

    return db;
}
