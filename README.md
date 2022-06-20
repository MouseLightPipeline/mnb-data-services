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

`docker run -it --rm --network mnb_back_tier -e NODE_ENV=production -e DATABASE_PW=${DATABASE_PW} -v /data/sites/mnb/:/opt/data mouselightdatabrowser/data-services:1.6 /bin/bash`

assuming a typical setup with the mnb_back_tier network.

There are two coordinates (2.5 and 3.0), and two "visibilities' (public and internal).
Depending on the required output, the `export` command will be run mutliple times,

From example

`export DEBUG=mnb:*`

`yarn run export --ccfVersion=Ccf25 --visibility=Internal`

`yarn run export --ccfVersion=Ccf30 --visibility=Internal`

would generate both sets of swc and json files for all neurons in the database for both coordinates.

`export DEBUG=mnb:*`

`yarn run export --ccfVersion=Ccf25 --visibility=Public`

`yarn run export --ccfVersion=Ccf30 --visibility=Public`

would do the same only for those neurons marked for public release (external brower instance).

## Optimized Search (Internal)
This functionality transforms tracings and any associated data required for the search service into a format more suitable
for search/query performance.

From the location of the mnb-internal-deploy repo  (currently on `mouselight.int.janelia.org`) as `mluser`

`cd /data/sites/mnb/mnb-internal-deploy`

`source options.sh`

Start an interactive session connected to the system

`docker run -it --rm --network mnb_back_tier -e NODE_ENV=production -e DATABASE_PW=${DATABASE_PW} mouselightdatabrowser/data-services:1.6 /bin/bash`

Perform the migration

`export DEBUG=mnb*`

`yarn run optimize`

You will see the relative progress as the content is transformed.  It can take several minutes to complete.

The above will only optimize neurons/tracings that have been modified since the last update.  To force a complete update
of all contents include `forceUpdate`.

`yarn run optimize --forceUpdate=true`

At this point the database will be updated, however the system caches the known tracings for performance.

Restart the services and reload the cache 

`./stop.sh`

`./up.sh`

## Optimized Search (External)
This is similar to the above process for internal the search database.  The primary difference is the optimized output is stored
in a different search database that only contains neurons marked for public use.  This allows for a simple database
dump and restore on the external service.

Most of these actions are performed using the internal instances to prepare, stage, and export the data.  The final step involves
importing the staged data into the actual public instance.

#### Migration (if required)

In the internal deploy directory, load the configuration

`cd /data/sites/mnb/mnb-internal-deploy`

`source options.sh`

If the public search database has never been populated or the schema has been changed, it must be migrated.  Start an interactive session with a 
sample-api container

`docker run -it --rm --network mnb_back_tier -e NODE_ENV=production -e DATABASE_PW=${DATABASE_PW} mouselightdatabrowser/search-api:1.6 /bin/bash`

In the container shell, point to the public search database instance

`export SEARCH_DB_HOST=search-public-db`

and migrate

`./migrate.sh`

You can now exit the container.

#### Update Internal Instance of Public Database

The internal instance of the public database is a database container accessible from the internal compose network and
services.  It is not the 

Start an interactive session with a data-services container connected to the system

`docker run -it --rm --network mnb_back_tier -e NODE_ENV=production -e DATABASE_PW=${DATABASE_PW} -v /data/sites/mnb/:/opt/data mouselightdatabrowser/data-services:1.6 /bin/bash`

In the container shell, point to the public search database instance and enable feedback

`export SEARCH_DB_HOST=search-public-db`

`export DEBUG=mnb*`

Perform the translation using only neurons with a visibility level of public (4)

`node optimize/optimize.js --visibility=4`

You will see the relative progress as the content is transformed.  It can take several minutes to complete.

#### Dump Public Data

Dump the resulting database for import into the external instance (you will need to enter the database password).

`pg_dump -h search-public-db -p 5432 -U postgres search_production | gzip > /opt/data/backup/search-public/search-public.pg.gz`

#### Load Public Data to Staging and/or Public Instance

The staging instance refers to a complete instance of the `mnb-public-deploy` system on an internal network for testing
and validation.  The public instance refers the external, generally accessible instance.

##### Staging Instance
The staging instance is the set of services that runs on the public browser virtual machine.  It has the same number
of service instances as the public instance and does not contain the data manager services that are only used internally for
data preparation (Sample Manager, SWC Manager, etc).

This instance is normally turned off unless a new set of published tracings is being tested/verified before pushing to the public instance to conserve resources.

Start an interactive data-services container on the host and docker network that contains the public instance: 

`cd /data/sites/mnb/mnb-public-deploy`

`source .env`

followed by

`docker run -it --rm --network mnb-public_back_tier -e NODE_ENV=production -e PGPASSWORD=${DATABASE_PW} -v /data/sites/mnb/:/opt/data mouselightdatabrowser/data-services:1.6 /bin/bash`

Execute the following commands (assumings a similar volume mapping above to expose the .pg file in the location below)

`psql -h search-db -p 5432 -U postgres -d search_production -c "DROP SCHEMA public CASCADE;"`

`psql -h search-db -p 5432 -U postgres -d search_production -c "CREATE SCHEMA public;"`

`psql -h search-db -p 5432 -U postgres -d search_production -c "GRANT ALL ON SCHEMA public TO postgres;"`

`psql -h search-db -p 5432 -U postgres -d search_production -c "GRANT ALL ON SCHEMA public TO public;"`

`psql -h search-db -p 5432 -U postgres -d search_production -f /opt/data/backup/search-public/search-public.pg`

Exit the container.

Restart the services and reload the cache 

`./stop.sh`

`./up.sh`

##### Public Instance

_Note that the search database container for the blue or green instance to be updated may need to be (re)started 
prior to the followings if it is the current offline instance._

Start an interactive data-services container on the host and docker network that contains the public instance (currently at `10.10.1.79`: 

`cd /data/mnb/blue`

or 

`cd /data/mnb/green`

depending on which is currently _inactive_ and will be receiving the update and made active.

`source .env`

followed by (assumes search database dump has placed in `data-import` in the respective instance location)

`docker run -it --rm --network mnbblue_back_tier -e NODE_ENV=production -e PGPASSWORD=${DATABASE_PW} -v /data/mnb/blue/data-import:/opt/data mouselightdatabrowser/data-services:1.6 /bin/bash`

or 

`docker run -it --rm --network mnbgreen_back_tier -e NODE_ENV=production -e PGPASSWORD=${DATABASE_PW} -v /data/mnb/green/data-import:/opt/data mouselightdatabrowser/data-services:1.6 /bin/bash`

depending on whether blue or green is next update.

Execute the following commands (assumings a similar volume mapping above to expose the .pg file in the location below)

`psql -h search-db -p 5432 -U postgres -d search_production -c "DROP SCHEMA public CASCADE;"`

`psql -h search-db -p 5432 -U postgres -d search_production -c "CREATE SCHEMA public;"`

`psql -h search-db -p 5432 -U postgres -d search_production -c "GRANT ALL ON SCHEMA public TO postgres;"`

`psql -h search-db -p 5432 -U postgres -d search_production -c "GRANT ALL ON SCHEMA public TO public;"`

`psql -h search-db -p 5432 -U postgres -d search_production -f /opt/data/search-public.pg`

## Synthetic
The synthetic script will populate the first three databases with generated data.  This a development script and is not
well-tested.

There is no pre-made script.  To use, start an interactive session

`docker run -it --rm --network mnb_back_tier -e NODE_ENV=production -e DATABASE_PW=${DATABASE_PW} mouselightdatabrowser/data-services:1.6 /bin/bash`

From there, navigate to the `synthetic` directory and use

`npm run generate`

## Step-By-Step Update of Public Dataset

This is the combination of the  various items above to do a typical update from the data managers to the internal/team instances, to the 
public staging instance, to the actual public instance.

#### On the Internal Production System

* Make sure all samples and neurons are marked public/internal/inherited/private as desired
* Perform the `Backup` section above
* `git pull` in the deployment directory (currently ~/mouselight/ne-system-prod on ml-ubuntu-test)
* If the search table schemas have changed
  * `docker pull` the latest version of the mouselightdatabrowser/data, /search-api, and /search-client containers
  * Drop all of the tables in the search database instance
  * Use `./migrate.sh` in the deployment directory
* Perform the `Optimized Search` section above and wait until it fully completes (need all nodes in the database for the next step
* Use `docker` to stop and restart search-api and search-client and verify the contents are correct and functional in the production viewer for what is expected on the public viewer
* `scp` the sql data dump file to /data-import on the public machine
* Perform the `Export` section above
    * `tar.gz` the json and swc ouput directories
    * `scp` them to /data/export on the public machine
* On the public machine
    * `docker pull` the latest version of the mouselightdatabrowser/data, /search-api, and /search-client containers
    * `git pull` the latest of the deploy-public deployment repository (currently in /data/ne-deploy-public)
    * drop all tables from the search_production database
    * use psql in the data container to load the data dump file
    * restart the system (./down.sh, ./up.sh)
    * wait for the search-api backends to finish caching the tracings and test
  
