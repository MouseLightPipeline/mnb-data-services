#!/usr/bin/env bash

echo "Perform backup of all databases."

if [ -z "${PGPASSWORD}" ]; then
    export PGPASSWORD="pgsecret"
fi

if [ -z "${BACKUP_VOL}" ]; then
    export BACKUP_VOL="/opt/data/backups"
fi

node backups/backup.ts ../sample/config/config.json ${BACKUP_VOL} sample

node backups/backup.ts ../swc/config/config.json ${BACKUP_VOL} swc

node backups/backup.ts ../transform/config/config.json ${BACKUP_VOL} transform
