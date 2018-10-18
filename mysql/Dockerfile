FROM mysql:5.7.22

ENV MYSQL_DATABASE="payment_gateway"

ADD payment_gateway_db.sql /docker-entrypoint-initdb.d/payment_gateway_db.sql
