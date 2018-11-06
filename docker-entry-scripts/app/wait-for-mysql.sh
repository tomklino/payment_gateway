#!/bin/sh

set -e

until nc -w1 $mysql__host 3306; do
  >&2 echo -n "."
  sleep 1
done

>&2 echo "mysql is up"
