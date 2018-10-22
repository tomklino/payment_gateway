#!/usr/bin/python
import os, json
from subprocess import call

base_dir = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(base_dir, os.pardir, "package.json")) as f:
    package_name = json.load(f)["name"]
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    call(["docker", "build",
        "--build-arg", "dbname=" + package_name,
        "-t", package_name + "_db", "."])
