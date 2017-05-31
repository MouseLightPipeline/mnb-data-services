## Data Management

This package creates a Docker image that manages database backup and migration.

#### Restore from Backup Examples
Restoring to a development environment.  When run inside a test or production container port will always be 5432.

``psql -h localhost -p 5432 --user postgres -f production_2017-05-26_03-25-04-sample.pg postgres``

``psql -h localhost -p 5433 --user postgres -f production_2017-05-26_03-25-05-swc.pg postgres``

``psql -h localhost -p 5434 --user postgres -f production_2017-05-26_03-25-12-transform.pg postgres``
