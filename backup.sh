#!/usr/bin/env bash

echo "perform backup of all databases."

# If pg_dump is not already on the path, set when calling the script or container.
if [[ ! -z ${PG_PATH} ]]; then
    PATH=$PATH:${PG_PATH}
fi

export PGPASSWORD=${DATABASE_PW}

yarn run backup sample

wait

yarn run backup swc

wait

yarn run backup transform

wait

yarn run backup search

wait
