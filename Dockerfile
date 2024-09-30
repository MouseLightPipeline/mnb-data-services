FROM node:20.10

WORKDIR /apps

# Update the package lists:
RUN apt update

RUN apt -y install postgresql-client

COPY dist .

RUN yarn install --production=true

RUN groupadd -g 1097 mousebrainmicro
RUN adduser -u 7700649 --disabled-password --gecos '' mluser
RUN usermod -a -G mousebrainmicro mluser

USER mluser

CMD ["./docker-entry.sh"]
