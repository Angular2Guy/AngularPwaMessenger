#!/bin/sh
helm delete --purge messenger
helm install ./ --name messenger --set serviceType=NodePort