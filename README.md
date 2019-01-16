# Data Services

This project creates a Docker image that manages migration, seeding, backup, and export from the databases, as well as ETL operations
from the internal system to the optimized search/production tables.

The system can be thought of in two parts:
* Data management, entry, and validation (internal)
* Search and interactive visual exploration (internal and user-facing)

These data services generally involve setup and maintenance of the internal data systems and transformation of the data from the
internal systems to the user-facing formats.

## Overview

There are currently five databases in the complete system:
* "Sample database" - Samples, neurons, and supporting elements (*e.g,* brain areas, registration files, etc.)
* "SWC database" - Imported SWC data and mappings to tracing structures and neurons
* "Transform database" - Transformed tracings and nodes
* "Search database" - A denormalized mapping of the data in the above three databases optimized for the search service
* "Metrics database" - Contains information on searches and query performance

General behavior:
* All but metrics are backed up with the default script.
* Export is requires all but the metrics database
* The optimized search database should be generated from the first three databases any time new tracings are to be pushed to the search service

## Backup
`backup.sh` is the default script of the container.  It generates backups of the data in the first four databases.  It
runs anytime the system is (re)started using any of the Docker Compose projects.  This container is launched, performs a
backup, and then exits.

#### Restore from Backup Examples
Restoring to a development environment.  When run inside a test or production container port will always be 5432.

``psql -h localhost -p 5432 --user postgres -f sample-latest.pg postgres``

``psql -h localhost -p 5433 --user postgres -f swc-latest.pg postgres``

``psql -h localhost -p 5434 --user postgres -f transform-latest.pg postgres``


#### Docker Container

`docker run -it --rm --network devndb_back_tier -v "/Volumes/Spare/Projects/Neuron Data Browser/backup":/data -e NODE_ENV=production mouselightdatabrowser/data psql -h sample-db --user postgres -f /data/sample-latest.pg postgres`

`docker run -it --rm --network devndb_back_tier -v "/Volumes/Spare/Projects/Neuron Data Browser/backup":/data -e NODE_ENV=production mouselightdatabrowser/data psql -h swc-db --user postgres -f /data/swc-latest.pg postgres`

`docker run -it --rm --network devndb_back_tier -v "/Volumes/Spare/Projects/Neuron Data Browser/backup":/data -e NODE_ENV=production mouselightdatabrowser/data psql -h transform-db --user postgres -f /data/transform-latest.pg postgres`

## Export
Export is used to generate the downloadable SWC and JSON neuron files from the search service rather than repeatedly generating
them on the fly.  This should be used any time the optimized search database is updated with new neurons/tracings. The
volume mapping below for output is an example for the current setup on mouselight.int.janelia.org.

There is no pre-made script for export.  To run, load the database password:

`source options.sh`

and start an interactive session connected to the system for the export

`docker run -it --rm --network mnb_back_tier -e NODE_ENV=production -e DATABASE_PW=${DATABASE_PW} -v /data/sites/mnb/:/opt/data mouselightdatabrowser/data-services:1.4 /bin/bash`

assuming a typical setup with the mnb_back_tier network.


From there use

`yarn run export`

## Optimized Search
This functionality transforms tracings and any associated data required for the search service into a format more suitable
for search/query performance.  Although the code has been implemented to support delta, that functionality is not well-tested.
At this time is likely better to drop the existing tables and repopulate from scratch.

To do this use yor graphical SQL tool of choice or the postgres command line interface to drop the existing tables.  Then
load the database password:

`source options.sh`

and start an interactive session connected to the system

`docker run -it --rm --network mnb_back_tier -e NODE_ENV=production -e DATABASE_PW=${DATABASE_PW} mouselightdatabrowser/data-services:1.4 /bin/bash`

Perform the migration

`yarn run optimize`

You will see the relative progress as the content is transformed.  It can take several minutes to complete.

## Synthetic
The synthetic script will populate the first three databases with generated data.  This a development script and is not
well-tested.

There is no pre-made script.  To use, start an interactive session

`docker run -it --rm --network mnb_back_tier -e NODE_ENV=production -e DATABASE_PW=${DATABASE_PW} mouselightdatabrowser/data-services:1.4 /bin/bash`

From there, navigate to the `synthetic` directory and use

`npm run generate`

## Step-By-Step Update of Public Dataset
#### On the Internal Production System

* Make sure all samples and neurons are marked public/internal/inherited/private as desired
* If the search table schemas have changed
    * `docker pull` the latest version of the mouselightdatabrowser/data, /search-api, and /search-client containers
* `git pull` in the deployment directory (currently ~/mouselight/ne-system-prod on ml-ubuntu-test)
* Drop all of the tables in the search database instance
* Use `./migrate.sh` in the deployment directory
* Perform the `Optimized Search` section above and wait until it fully completes (need all nodes in the database for the next step
* Use `docker` to stop and restart search-api and search-client and verify the contents are correct and functional in the production viewer for what is expected on the public viewer
* Perform the `Backup` section above
* `scp` the data dump file to /data/import on the public machine
* Perform the `Export` section above
    * `tar` the json and swc ouput directories
    * `scp` them to /data/export on the public machine
* On the public machine
    * `docker pull` the latest version of the mouselightdatabrowser/data, /search-api, and /search-client containers
    * `git pull` the latest of the deploy-public deployment repository (currently in /data/ne-deploy-public)
    * drop all tables from the search_production database
    * use psql in the data container to load the data dump file
    * restart the system (./down.sh, ./up.sh)
    * wait for the search-api backends to finish caching the tracings and test
  
