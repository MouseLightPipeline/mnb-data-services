#!/usr/bin/env bash

echo "Perform restore of all databases."

yarn run restore sample

wait

yarn run restore swc

wait

yarn run restore transform

wait
