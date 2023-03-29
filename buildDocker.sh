#!/bin/sh
#./mvnw clean install -Ddocker=true -Dnpm.test.script=test-chromium
./mvnw clean install -Ddocker=true
docker build -t angular2guy/angularpwamessenger:latest --build-arg JAR_FILE=messenger-backend-0.0.1-SNAPSHOT.jar --no-cache .
docker run -p 8080:8080 --memory="512m" --network="host" angular2guy/angularpwamessenger:latest