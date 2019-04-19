#!/bin/sh
minikube addons enable ingress
kubectl create secret tls minikube-tls --cert=tls.crt --key=tls.key
