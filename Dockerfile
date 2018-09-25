FROM node:8.12

RUN cd /tmp; wget https://support.hdfgroup.org/ftp/HDF5/releases/hdf5-1.10/hdf5-1.10.0-patch1/src/hdf5-1.10.0-patch1.tar.gz
RUN cd /tmp; tar xvzf hdf5-1.10.0-patch1.tar.gz
RUN cd /tmp/hdf5-1.10.0-patch1; ./configure --prefix=/usr/local --enable-cxx
RUN cd /tmp/hdf5-1.10.0-patch1; make
RUN cd /tmp/hdf5-1.10.0-patch1; make install

ENV PG_APP_HOME="/etc/docker-postgresql"\
    PG_VERSION=9.6 \
    PG_USER=postgres \
    PG_HOME=/var/lib/postgresql \
    PG_RUNDIR=/run/postgresql \
    PG_LOGDIR=/var/log/postgresql \
    PG_CERTDIR=/etc/postgresql/certs

ENV PG_BINDIR=/usr/lib/postgresql/${PG_VERSION}/bin \
    PG_DATADIR=${PG_HOME}/${PG_VERSION}/main

RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
 && echo 'deb http://apt.postgresql.org/pub/repos/apt/ trusty-pgdg main' > /etc/apt/sources.list.d/pgdg.list \
 && apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y acl \
      postgresql-${PG_VERSION} postgresql-client-${PG_VERSION} postgresql-contrib-${PG_VERSION} \
 && ln -sf ${PG_DATADIR}/postgresql.conf /etc/postgresql/${PG_VERSION}/main/postgresql.conf \
 && ln -sf ${PG_DATADIR}/pg_hba.conf /etc/postgresql/${PG_VERSION}/main/pg_hba.conf \
 && ln -sf ${PG_DATADIR}/pg_ident.conf /etc/postgresql/${PG_VERSION}/main/pg_ident.conf \
 && rm -rf ${PG_HOME} \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /apps

# Install production app dependencies
RUN yarn global add typescript node-gyp

# Bundle apps
COPY . .

RUN cd /apps/swc; yarn install
RUN cd /apps/swc; tsc

RUN cd /apps/transform; yarn install
RUN cd /apps/transform; tsc

RUN cd /apps/influx; yarn install
RUN cd /apps/influx; tsc

RUN cd /apps/backups; yarn install
RUN cd /apps/backups; tsc

RUN cd /apps/synthetic; yarn install
RUN cd /apps/synthetic; tsc

RUN cd /apps/search; yarn install
RUN cd /apps/search; tsc

CMD ["/apps/backup.sh"]
