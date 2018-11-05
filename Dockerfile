FROM mhart/alpine-node:11

RUN mkdir -p /opt/app
RUN mkdir -p /entrypoint.d

COPY app.js /opt/app
COPY config-loader.js /opt/app
COPY config.defaults.json /opt/app
COPY project_modules /opt/app/project_modules
COPY node_modules /opt/app/node_modules

COPY docker-init.sh /

WORKDIR /opt/app

ENTRYPOINT [ "/docker-init.sh" ]
