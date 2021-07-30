# AngularPwaMessenger

Author: Sven Loesekann

Technologies: PWA, Angular, Angular-Cli, Angular-Material, Typescript, Spring Boot, Java, Spring Webflux, MongoDB, Maven, Docker

## Articles
* [An Angular PWA From Front-End to Backend: Sign In and Add Contacts](https://dzone.com/articles/an-angular-pwa-from-frontend-to-backend)
* [An Angular PWA From Front-End to Backend: Creating a Login Process](https://dzone.com/articles/draft-an-angular-pwa-from-frontend-to-backend-the)
* [An Angular PWA From Front-End to Backend: Send/Receive Messages](https://dzone.com/articles/an-angular-pwa-from-front-end-to-backend-sendrecei)
* [An Angular PWA From Front-End to Backend: Kubernetes Deployment](https://dzone.com/articles/an-angular-pwa-from-front-end-to-backend-kubernete)
* [Angular Translations Have Arrived](https://dzone.com/articles/angular-translations-have-arrived)

## What is the goal?

The goal is to provide an Angular based Progressive Web App with a backend server that has a usecase. To do that the PWA uses the Angular PWA support and Angular Material. The backend server is written with Spring Boot and uses its Webflux features with the MongoDB database in clean architecture. For development the project uses an in memory MongoDB to be just cloned and ready to run. More documentation can be found in the wiki.

## What is it?

The application is an encrypted chat system that can be run offline. The PWA is served by the server like any website and installs a service worker. Then it can run offline because the PWA stores the data locally in the browser. The login, the chat history and sending new messages work offline. The messages can be text of photos taken with the devices camera. When the PWA is online again the stored pending messages are send to the server and it is checked for new messages. Adding new contacts and signing in only works online. The backend server stores only the pending messages and the available contacts and is implemented in clean architecture. That is checked with an ArchUnit test. The message texts are send encrypted and are stored encrypted. (If you delete your browsers indexed DB your chat history and your contacts are gone!) 

## Minikube setup

The application can be run in a Minikube cluster. The cluster runs the docker images for the AngularPwaMessenger and the Mongodb. The Mongodb has a persistent volume to store its data between restarts. The configuraton of the application can be found in the helm directory and is done as a helm chart. To run it minikube, kubectl and helm need to be installed. Further documentation can be found in the wiki.

## Setup

MongoDB 3.4.x or newer.

Eclipse 2018-09 or newer.

Install Eclipse Plugin 'Java 16 Support for Eclipse 2021-03' of the Eclipse Marktplace.(free)

Maven 3.3.3 or newer.

Java 16 or newer

Nodejs 14.15.x or newer

Npm 6.14.x or newer

Angular Cli 12 or newer.
