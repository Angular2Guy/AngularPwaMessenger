# AngularPwaMessenger

Author: Sven Loesekann

Technologies: PWA, Angular, Angular-Cli, Angular-Material, Typescript, Spring Boot, Java, Spring Webflux, MongoDB, Maven, Docker

## Articles
* [An Angular PWA From Front-End to Backend: Sign In and Add Contacts](https://angular2guy.wordpress.com/2021/07/31/an-angular-pwa-from-front-end-to-backend-sign-in-and-add-contacts/)
* [An Angular PWA From Front-End to Backend: Creating a Login Process](https://angular2guy.wordpress.com/2021/07/31/an-angular-pwa-from-front-end-to-backend-creating-a-login-process/)
* [An Angular PWA From Front-End to Backend: Send/Receive Messages](https://angular2guy.wordpress.com/2021/07/31/an-angular-pwa-from-front-end-to-backend-send-receive-messages/)
* [An Angular PWA From Front-End to Backend: Kubernetes Deployment](https://angular2guy.wordpress.com/2021/07/31/an-angular-pwa-from-front-end-to-backend-kubernetes-deployment/)
* [Angular Translations Have Arrived](https://angular2guy.wordpress.com/2021/07/31/angular-translations-have-arrived/)

## What is the goal?

The goal is to provide an Angular based Progressive Web App with a backend server that has a usecase. To do that the PWA uses the Angular PWA support and Angular Material. The backend server is written with Spring Boot and uses its Webflux features with the MongoDB database in clean architecture. For development the project uses an in memory MongoDB to be just cloned and ready to run. More documentation can be found in the wiki.

## What is it?

The application is an encrypted chat system that can be run offline. The PWA is served by the server like any website and installs a service worker. Then it can run offline because the PWA stores the data locally in the browser. The login, the chat history and sending new messages work offline. The messages can be text of photos taken with the devices camera. When the PWA is online again the stored pending messages are send to the server and it is checked for new messages. Adding new contacts and signing in only works online. The backend server stores only the pending messages and the available contacts and is implemented in clean architecture. That is checked with an ArchUnit test. The message texts are send encrypted and are stored encrypted. (If you delete your browsers indexed DB your chat history and your contacts are gone!) 

## Minikube setup

The application can be run in a Minikube cluster. The cluster runs the docker images for the AngularPwaMessenger and the Mongodb. The Mongodb has a persistent volume to store its data between restarts. The configuraton of the application can be found in the helm directory and is done as a helm chart. It uses the resource limit support of Jdk 16 to limit memory. Kubernetes limits the cpu use and uses the startupprobes and livenessprobes that Spring Actuator provides. To run it minikube, kubectl and helm need to be installed. Further documentation can be found in the wiki.

## Setup

MongoDB 3.4.x or newer.

Eclipse IDE for Enterprise Java and Web Developers newest version.

Maven 3.5.4 or newer.

Java 16 or newer

Nodejs 14.15.x or newer

Npm 6.14.x or newer

Angular Cli 12 or newer.
