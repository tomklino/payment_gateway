#!/bin/sh

set -e

until nc -w1 app 3030; do
  >&2 echo -n "."
  sleep 1
done

>&2 echo "app is up"
