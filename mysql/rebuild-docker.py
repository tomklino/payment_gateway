#!/usr/bin/python
import os
from subprocess import call

os.chdir(os.path.dirname(os.path.abspath(__file__)))
call(["docker", "build", "-t", "lutraman/payment_gateway_db", "."])
