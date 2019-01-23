#!/usr/bin/env bash

echo "perform restore of all databases."

# If psql is not already on the path, set when calling the script or container.
if [[ ! -z ${PG_PATH} ]]; then
    PATH=$PATH:${PG_PATH}
fi

export PGPASSWORD=${DATABASE_PW}

yarn run restore sample

wait

yarn run restore swc

wait

yarn run restore transform

wait
