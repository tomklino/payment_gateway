#!/bin/sh

set -x

for script in $(ls /entrypoint.d | sort); do
  /entrypoint.d/$script;
done;

echo "entry scripts done, running app..."

node app $@
