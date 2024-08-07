# This is an example of a Progressive Web Application(PWA) with an Angular frontend and a Spring Boot backend with MongoDb. 

Author: Sven Loesekann

Technologies: PWA, WebRtc, WebSocket(Frontend, Backend), Angular, Angular-Cli, Angular-Material, Typescript, Spring Boot, Java, Spring Webflux, MongoDB, Maven, Docker

[![CodeQL](https://github.com/Angular2Guy/AngularPwaMessenger/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/Angular2Guy/AngularPwaMessenger/actions/workflows/codeql-analysis.yml)

## Articles
* [Do you need a friend in a Messenger?](https://angular2guy.wordpress.com/2024/03/03/do-you-need-an-ai-friend-in-a-messenger/)
* [Multiplayer Bingo Games with Angular and Spring Boot Part1](https://angular2guy.wordpress.com/2023/10/06/multiplayer-bingo-games-with-angular-and-spring-boot-part1/)
* [Spring Boot 3 update experience](https://angular2guy.wordpress.com/2022/11/15/spring-boot-3-update-experience/)
* [Videocalls in the AngularPwaMessenger Part2](https://angular2guy.wordpress.com/2022/08/04/videocalls-in-the-angularpwamessenger-part2/)
* [Videocalls in the AngularPwaMessenger Part1](https://angular2guy.wordpress.com/2022/08/01/videocalls-in-the-angularpwamessenger-part1/)
* [An Angular PWA From Front-End to Backend: Sign In and Add Contacts](https://angular2guy.wordpress.com/2021/07/31/an-angular-pwa-from-front-end-to-backend-sign-in-and-add-contacts/)
* [An Angular PWA From Front-End to Backend: Creating a Login Process](https://angular2guy.wordpress.com/2021/07/31/an-angular-pwa-from-front-end-to-backend-creating-a-login-process/)
* [An Angular PWA From Front-End to Backend: Send/Receive Messages](https://angular2guy.wordpress.com/2021/07/31/an-angular-pwa-from-front-end-to-backend-send-receive-messages/)
* [An Angular PWA From Front-End to Backend: Kubernetes Deployment](https://angular2guy.wordpress.com/2021/07/31/an-angular-pwa-from-front-end-to-backend-kubernetes-deployment/)
* [Angular Translations Have Arrived](https://angular2guy.wordpress.com/2021/07/31/angular-translations-have-arrived/)

## Backend improvement

The Spring Boot MongoDb server can now handle more concurrent users.

## What is the goal?

The goal is to provide an Angular based Progressive Web App with a backend server that offers chats or video calls. To do that the PWA uses the Angular PWA support and Angular Material. The backend server is written with Spring Boot and uses its Webflux features with the MongoDB database in clean architecture. For development the project uses an in memory MongoDB to be just cloned and ready to run. More documentation can be found in the [blog](https://angular2guy.wordpress.com).

## What is it?

The application is an encrypted chat system that can be run offline. The PWA is served by the server like any website and installs a service worker. Then it can run offline because the PWA stores the data locally in the browser. The login, the chat history and sending new messages work offline. The messages can be text of photos taken with the devices camera. When the PWA is online again the stored pending messages are send to the server and it is checked for new messages. Adding new contacts and signing in only works online. The backend server stores only the pending messages and the available contacts and is implemented in clean architecture. That is checked with an ArchUnit test. The message texts are send encrypted and are stored encrypted. (If you delete your browsers indexed DB your chat history and your contacts are gone!).<br/>
The video calls are done with WebRtc in the Angular frontend in the browser and need the ability of the browsers to connect to each other. The WebSocket is used for signaling and is supported by the Spring Boot backend.  

The application has been extended to provide a bingo game. The Frontend is implemented in Angular lazy loaded standalone components and the backend is done in Spring Boot with reactive Controllers/Services/Repositories. 

### AI friend available as new contact
The application has been extended to provide an AI friend that can can provide companionship. It uses Spring AI to call a Ollama model that is trained with psychological/philosophical data. To enable it the application has to be started with the 'ollama' profile and Ollama has to be installed or run in a docker container. The needed commands for the docker container can be found in this [file](https://github.com/Angular2Guy/AngularPwaMessenger/blob/master/runOllama.sh).

## C4 Architecture Diagrams
The project has a [System Context Diagram](structurizr/diagrams/structurizr-1-SystemContext.svg), a [Container Diagram](structurizr/diagrams/structurizr-1-Containers.svg) and a [Component Diagram](structurizr/diagrams/structurizr-1-Components.svg). The Diagrams have been created with Structurizr. The file runStructurizr.sh contains the commands to use Structurizr and the directory structurizr contains the dsl file.

## Minikube setup

The application can be run in a Minikube cluster. The cluster runs the docker images for the AngularPwaMessenger and the Mongodb. The Mongodb has a persistent volume to store its data between restarts. The configuraton of the application can be found in the helm directory and is done as a helm chart. It uses the resource limit support of Jdk 16 to limit memory. Kubernetes limits the cpu use and uses the startupprobes and livenessprobes that Spring Actuator provides. To run it minikube, kubectl and helm need to be installed. Further documentation can be found in the wiki.

## Monitoring
The Spring Actuator interface with Prometheus interface can be used as it is described in this article: 

[Monitoring Spring Boot with Prometheus and Grafana](https://ordina-jworks.github.io/monitoring/2020/11/16/monitoring-spring-prometheus-grafana.html)

To test the setup the application has to be started and the Docker Images for Prometheus and Grafana have to be started and configured. The scripts 'runGraphana.sh' and 'runPrometheus.sh' can be used as a starting point.

## Setup

MongoDB 4.4.x or newer.

Eclipse IDE for Enterprise Java and Web Developers newest version.

Maven 3.9.5 or newer.

Java 21 or newer

Nodejs 18.19.x or newer

Npm 10.2.x or newer

Angular Cli 18 or newer.
