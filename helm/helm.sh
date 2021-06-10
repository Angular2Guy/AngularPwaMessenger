#!/bin/sh
helm delete messenger
helm install messenger ./  --set serviceType=NodePort