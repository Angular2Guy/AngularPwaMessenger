# AngularPwaMessenger

![Build Status](https://travis-ci.org/Angular2Guy/AngularPwaMessenger.svg?branch=master)

Author: Sven Loesekann

Technologies: PWA, Angular, Angular-Cli, Angular-Material, Typescript, Spring Boot, Spring Webflux, MongoDB, Maven, Docker

## What is the goal?

The goal is to provide an Angular based Progressive Web App with a backend server that has a usecase. To do that the PWA uses the Angular PWA support and Angular Material. The backend server is written with Spring Boot and uses its Webflux features with the MongoDB database. For development the project uses an in memory MongoDB to be just cloned and ready to run. More documentation can be found in the wiki.

## What is it?

The application is an encrypted chat system that can be run offline. The PWA is served by the server like any website and installs a service worker. Then it can run offline because the PWA stores the data locally in the browser. The login, the chat history and sending new messages work offline. The messages can be text of photos taken with the devices camera. When the PWA is online again the stored pending messages are send to the server and it is checked for new messages. Adding new contacts and signing in only works online. The backend server stores only the pending messages and the available contacts. The message texts are send encrypted and are stored encrypted. (If you delete your browsers indexed DB your chat history and your contacts are gone!)    

## Minikube setup

The application can be run in a Minikube cluster. The cluster runs the docker images for the AngularPwaMessenger and the Mongodb. The Mongodb has a persistent volume to store its data between restarts. The configuraton of the application can be found in the helm directory and is done as a helm chart. To run it minikube, kubectl and helm need to be installed. Further documentation can be found in the wiki.

## Setup

MongoDB 3.4.x or newer.

Eclipse 2018-09 or newer.

Plugin Typescript.Java 1.4.0 or newer.

Maven 3.3.3 or newer.

Nodejs 12.16.x or newer

Npm 6.13.4 or newer

Angular Cli 11 or newer.
