#!/usr/bin/python
import os, json
from subprocess import call
from argparse import ArgumentParser

parser = ArgumentParser()
parser.add_argument('--gcloud', action='store_true', dest='gcloud', default=False)
args = parser.parse_args()

base_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(base_dir)

if args.gcloud:
    call(['gcloud', 'builds', 'submit',
    '--config', 'cloudbuild.yml',
    '--substitutions=_DBNAME=payment-gateway', '.'])
else:
    with open(os.path.join(base_dir, os.pardir, "package.json")) as f:
        package_name = json.load(f)["name"]
        call(["docker", "build",
            "--build-arg", "dbname=" + package_name,
            "-t", package_name + "_db", "."])
