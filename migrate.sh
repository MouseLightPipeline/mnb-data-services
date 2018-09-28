#!/usr/bin/env bash

if [ ! -z "$1" ]
  then
    export DATABASE_HOST=$1
fi

echo "Perform migrate for all databases."

cd "../swc"
npm run migrate

cd "../transform"
npm run migrate

cd "../search"
npm run migrate
