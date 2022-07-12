#!/bin/sh
minikube addons enable ingress
#openssl genrsa -out rootCa.key 4096
#openssl req -x509 -new -key rootCa.key -sha256 -nodes -keyout rootCa.key -out rootCa.pem -days 3650 -subj "/C=ry/ST=te/L=ty/O=on/OU=it/CN=minikube"
#openssl genrsa -out ca.key 4096
#openssl req -new -key ca.key -out ca.csr -subj "/C=ry/ST=te/L=ty/O=on/OU=it/CN=minikube"
#openssl x509 -req -in ca.csr -CA rootCa.pem -CAkey rootCa.key -CAcreateserial -out ca.crt -days 3650 -sha256 -extfile cert.conf
#openssl genrsa -out server.key 4096
#openssl req -new -key server.key -out server.csr -config server.conf
#openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 3650 -extensions v3_ext -extfile server.conf
// copy server.p12 to testCert/server.p12
#openssl pkcs12 -export -in server.crt -inkey server.key -out server.p12 -name tomcat //password for this file(change for non test use!!!): apwamessenger
#keytool -list -v -keystore server.p12 //check keystore
kubectl create secret tls minikube-tls --cert=ca.crt --key=ca.key
kubectl create -f ./ingress.yaml