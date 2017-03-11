FROM node:7.5

WORKDIR /apps

# Install production app dependencies
RUN npm install -g yarn typescript

# Bundle apps
COPY sample sample/
COPY swc swc/
COPY transform transform/

RUN cd /apps/sample; yarn install
RUN cd /apps/sample; tsc

RUN cd /apps/swc; yarn install
RUN cd /apps/swc; tsc

RUN cd /apps/transform; yarn install
RUN cd /apps/transform; tsc

CMD ["./backup.sh"]
