#!/bin/sh
minikube addons enable ingress
#openssl req -x509 -newkey rsa:4096 -sha256 -nodes -keyout tls.key -out tls.crt -subj "/CN=minikube" -days 3650
kubectl create secret tls minikube-tls --cert=tls.crt --key=tls.key
