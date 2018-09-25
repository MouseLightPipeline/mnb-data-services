#!/usr/bin/env bash

echo "This script will add defaults even if they are already present.  It should only be run once when the database is created.  Proceed? [y/n]"

read confirm

if [ "$confirm" != "y" ]; then
    echo "smart choice, exiting without changes"
    exit 1
fi

echo "No really, this could be a very bad choice.  Proceed? [y/n]"

read confirm

if [ "$confirm" != "y" ]; then
    echo "nice save, exiting without changes"
    exit 1
fi

echo "processing with seed - you were warned"

if [ ! -z "$1" ]
  then
    export DATABASE_HOST=$1
fi

if [ ! -z "$1" ]
  then
    export DATABASE_PORT=5433
fi

cd "../swc"
npm run seed
