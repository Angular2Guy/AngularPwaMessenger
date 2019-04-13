#!/bin/sh
docker build -t angular2guy/angularpwamessenger:latest --build-arg JAR_FILE=messenger-0.0.1-SNAPSHOT.jar --no-cache .
