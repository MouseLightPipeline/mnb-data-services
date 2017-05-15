#!/usr/bin/env bash

if [ ! -z "$1" ]
  then
    export DATABASE_HOST=$1
fi

echo "Perform migrate for all databases."

cd "./sample"
npm run migrate

if [ ! -z "$1" ]
  then
    export DATABASE_PORT=5433
fi

cd "../swc"
npm run migrate

if [ ! -z "$1" ]
  then
    export DATABASE_PORT=5434
fi

cd "../transform"
npm run migrate

if [ ! -z "$1" ]
  then
    export DATABASE_PORT=
fi

cd "../influx"
npm run migrate
