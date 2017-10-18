## Data Management

This package creates a Docker image that manages database backup and migration.

#### Restore from Backup Examples
Restoring to a development environment.  When run inside a test or production container port will always be 5432.

``psql -h localhost -p 5432 --user postgres -f sample-latest.pg postgres``

``psql -h localhost -p 5433 --user postgres -f swc-latest.pg postgres``

``psql -h localhost -p 5434 --user postgres -f transform-latest.pg postgres``


#### Docker Container

`docker run -it --rm --network devndb_back_tier -v "/Volumes/Spare/Projects/Neuron Data Browser/backups":/data -e NODE_ENV=production mouselightdatabrowser/data psql -h sample-db --user postgres -f /data/sample-latest.pg postgres`

`docker run -it --rm --network devndb_back_tier -v "/Volumes/Spare/Projects/Neuron Data Browser/backups":/data -e NODE_ENV=production mouselightdatabrowser/data psql -h swc-db --user postgres -f /data/swc-latest.pg postgres`

`docker run -it --rm --network devndb_back_tier -v "/Volumes/Spare/Projects/Neuron Data Browser/backups":/data -e NODE_ENV=production mouselightdatabrowser/data psql -h transform-db --user postgres -f /data/transform-latest.pg postgres`
