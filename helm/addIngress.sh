#!/bin/sh
minikube addons enable ingress
#openssl genrsa -out ca.key 2048
#openssl req -x509 -new -key ca.key -sha256 -nodes -keyout ca.key -out ca.crt -subj "/CN=minikube" -days 3650
#openssl genrsa -out server.key 2048
#openssl req -new -key server.key -out server.csr -config csr.conf
#openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 3650 -extensions v3_ext -extfile csr.conf
kubectl create secret tls minikube-tls --cert=ca.crt --key=ca.key
kubectl create -f ./ingress.yaml