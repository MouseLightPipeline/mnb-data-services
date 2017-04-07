#!/usr/bin/env bash

echo "Perform migrate for all databases."

cd "./sample"
sequelize db:migrate

cd "../swc"
sequelize db:migrate

cd "../transform"
sequelize db:migrate

cd "../influx"
node migrate.js
