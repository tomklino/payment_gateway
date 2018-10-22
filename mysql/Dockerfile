FROM mysql:5.7.22

ARG dbname

ENV MYSQL_DATABASE=$dbname

ADD schema.sql /docker-entrypoint-initdb.d/schema.sql
