#!/usr/bin/env bash

echo "Perform backup of all databases."

if [ -z ${PGPASSWORD} ]; then
    export PGPASSWORD="pgsecret"
fi

if [ -z ${BACKUP_VOL} ]; then
    export BACKUP_VOL="/opt/data/backups"
fi

if [ ! -z "$1" ]
  then
    export DATABASE_HOST=$1
fi

cd backups

npm run backup -- ./sampleDatabaseOptions ${BACKUP_VOL} sample

if [ ! -z "$1" ]
  then
    export DATABASE_PORT=5433
fi

npm run backup -- ../swc/options/databaseOptions ${BACKUP_VOL} swc

if [ ! -z "$1" ]
  then
    export DATABASE_PORT=5434
fi

npm run backup -- ../transform/options/databaseOptions ${BACKUP_VOL} transform

if [ ! -z "$1" ]
  then
    export DATABASE_PORT=5435
fi

npm run backup -- ../search/src/options/databaseOptions ${BACKUP_VOL} search
