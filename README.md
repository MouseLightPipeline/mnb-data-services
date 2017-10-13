## Data Management

This package creates a Docker image that manages database backup and migration.

#### Restore from Backup Examples
Restoring to a development environment.  When run inside a test or production container port will always be 5432.

``psql -h localhost -p 5432 --user postgres -f production_2017-05-26_03-25-04-sample.pg postgres``

``psql -h localhost -p 5433 --user postgres -f production_2017-05-26_03-25-05-swc.pg postgres``

``psql -h localhost -p 5434 --user postgres -f production_2017-05-26_03-25-12-transform.pg postgres``


#### Docker Container

`docker run -it --rm --network devndb_back_tier -v "/Volumes/Spare/Projects/Neuron Data Browser/database/2017-05-26-backup":/data -e NODE_ENV=production mouselightdatabrowser/data psql -h sample-db --user postgres -f /data/production_2017-05-26_03-25-04-sample.pg postgres`

`docker run -it --rm --network devndb_back_tier -v "/Volumes/Spare/Projects/Neuron Data Browser/database/2017-05-26-backup":/data -e NODE_ENV=production mouselightdatabrowser/data psql -h swc-db --user postgres -f /data/production_2017-05-26_03-25-05-swc.pg postgres`

`docker run -it --rm --network devndb_back_tier -v "/Volumes/Spare/Projects/Neuron Data Browser/database/2017-05-26-backup":/data -e NODE_ENV=production mouselightdatabrowser/data psql -h transform-db --user postgres -f /data/production_2017-05-26_03-25-12-transform.pg postgres`
