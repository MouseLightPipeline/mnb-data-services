FROM node:12.9

WORKDIR /apps

RUN apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net --recv-keys B97B0AFCAA1A47F044F244A07FCC7D46ACCC4CF8

RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ stretch-pgdg main" > /etc/apt/sources.list.d/pgdg.list

RUN apt-get update && apt-get install -y software-properties-common postgresql-9.3 postgresql-client-9.3 postgresql-contrib-9.3

COPY dist .

RUN yarn install --production=true

RUN groupadd -g 1097 mousebrainmicro
RUN adduser -u 7700649 --disabled-password --gecos '' mluser
RUN usermod -a -G mousebrainmicro mluser

USER mluser

CMD ["./docker-entry.sh"]
