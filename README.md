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
* All five databases have migrations
* Only the same and SWC databases are seeded with fixed items
* All but metrics are backed up with the default script.
* Export is an function of all but the metrics database
* The optimized search database should be generated from the first three databases any time new tracings are to be pushed to the search service

## Migration
`migrate.sh` should be run anytime one of the database schemas is modified.

## Seeding
`seed.sh` should only be run when initializing a new system for the first time after the first migration.  There are
currently no protections against running the seeding twice on the same database, other than multiple interactive 
confirmations in the script itself

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

`docker run -it --rm --network devndb_back_tier -v "/Volumes/Spare/Projects/Neuron Data Browser/backups":/data -e NODE_ENV=production mouselightdatabrowser/data psql -h sample-db --user postgres -f /data/sample-latest.pg postgres`

`docker run -it --rm --network devndb_back_tier -v "/Volumes/Spare/Projects/Neuron Data Browser/backups":/data -e NODE_ENV=production mouselightdatabrowser/data psql -h swc-db --user postgres -f /data/swc-latest.pg postgres`

`docker run -it --rm --network devndb_back_tier -v "/Volumes/Spare/Projects/Neuron Data Browser/backups":/data -e NODE_ENV=production mouselightdatabrowser/data psql -h transform-db --user postgres -f /data/transform-latest.pg postgres`

## Export
Export is used to generate the downloadable SWC and JSON neuron files from the search service rather than repeatedly generating
them on the fly.  This should be used any time the optimized search database is updated with new neurons/tracings.

There is no pre-made script for export.  To run, start an interactive session connected to the system for the export.

`docker run -it --rm --network ndb_back_tier -e NODE_ENV=production mouselightdatabrowser/data /bin/bash`

assuming a typical setup with the ndb_back_tier network.

From there, navigate to the `export` directory and use

`npm run generate`

## Optimized Search
This functionality transforms tracings and any associated data required for the search service into a format more suitable
for search/query performance.  Although the code has been implemented to support delta, that functionality is not well-tested.
At this time is likely better to drop the existing tables and repopulate from scratch.

To do this use yor graphical SQL tool of choice or the postgres command line interface to drop the existing tables.  Then
start an interactive container session

`docker run -it --rm --network ndb_back_tier -e NODE_ENV=production mouselightdatabrowser/data /bin/bash`

Navigate to the `search` directory and use 

`npm run generate`

You will see the relative progress as the content is transformed.  It can take several minutes to complete.

## Synthetic
The synthetic script will populate the first three databases with generated data.  This a development script and is not
well-tested.

There is no pre-made script.  To use, start an interactive session

`docker run -it --rm --network ndb_back_tier -e NODE_ENV=production mouselightdatabrowser/data /bin/bash`

From there, navigate to the `synthetic` directory and use

`npm run generate`
