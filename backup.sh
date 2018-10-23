#!/usr/bin/env bash

echo "Perform backup of all databases."

yarn run backup sample

wait

yarn run backup swc

wait

yarn run backup transform

wait

yarn run backup search

wait
