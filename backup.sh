#!/usr/bin/env bash

echo "Perform backup of all databases."

cd backups

npm run backup -- sample

wait

npm run backup -- swc

wait

npm run backup -- transform

wait

npm run backup -- search

wait
