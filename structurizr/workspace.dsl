workspace "AngularPwaMessenger" "This is a project to show howto do encrypted messaging and Webrtc video calls with an Angular Frontend and a Spring Boot Backend." {

    model {
        user = person "User"
        angularPwaMessengerSystem = softwareSystem "AngularPwaMessenger" {
        	angularPwaMessenger = container "AngularPwaMessenger" "Angular Frontend and Spring Boot Backend to send encrypted messages and do video calls." {
        		angularFrontend = component "Angular Frontend" "The SPA encrypts and sends messages and does the video calls." tag "Browser"
        		backendJwtTokenFilters = component "Jwt Token Filters" "Provide the security based on Jwt Tokens."
        		backendAuthController = component "Auth Controller" "Provides the rest interfaces for Login / Signin / Logout."
        		backendMessageVideoControllers = component "Message/Video Controllers" "Provides the rest interfaces for Contacts / Messages / Calls."
        		backendWebSocketHandler = component "Video call Websocket handler" "Provides Websocket endpoint to support for Video calls."
        		backendAuthService = component "Auth Service" "Provides the logic for  login / signin / logout."
        		backendMessageVideoService = component "Message/Video Services" "Provides the logic for Contacts / Messages / Calls."
        		backendRepository = component "MongoDb Repository" "Repository that loads / stores the data."
        	}
        	database = container "MongoDb" "MongoDb stores all the data of the system."	
        }
	
	    # relationships people / software systems
        user -> angularPwaMessengerSystem "Uses"
        
        # relationships containers
        user -> angularPwaMessenger "send messages / do video calls"
        angularPwaMessenger -> database
        
        # relationships components
        angularFrontend -> backendAuthController "rest requests"
        angularFrontend -> backendMessageVideoControllers "rest requests"
        angularFrontend -> backendWebSocketHandler "websocket messages"
        backendAuthController -> backendJwtTokenFilters
        backendMessageVideoControllers -> backendJwtTokenFilters
        backendWebSocketHandler -> backendJwtTokenFilters
        backendAuthController -> backendAuthService
        backendMessageVideoControllers -> backendMessageVideoService
        backendAuthService -> backendRepository "store / read data"
        backendMessageVideoService -> backendRepository "store / read data" 
    }

    views {
        systemContext angularPwaMessengerSystem "SystemContext" {
            include *
            autoLayout
        }
        
        container angularPwaMessengerSystem "Containers" {
        	include *
            autoLayout lr
        }
        
        component angularPwaMessenger "Components" {
        	include *
            autoLayout
        } 
        
        styles {
        	element "Person" {            
            	shape Person
        	}
        	element "Database" {
                shape Cylinder                
            }
            element "Browser" {
                shape WebBrowser
            }          
        }
    }

}