workspace "AngularPwaMessenger" "This is a project to show howto do encrypted messaging and Webrtc video calls with an Angular Frontend and a Spring Boot Backend." {

    model {
        user = person "User"
        player = person "Player"
        angularPwaMessengerSystem = softwareSystem "AngularPwaMessenger" {
        	group "Application" {
        		angularPwaMessengerFrontend = container "AngularPwaFrontend" "Angular Frontend to send encrypted messages,do video calls and play Bingo." {}
        		angularPwaMessengerBackend = container "AngularPwaBackend" "Spring Boot Backend to send encrypted messages, do video calls and play Bingo." {    
            		group "Frontend" {    	        	
        				angularFrontend = component "Angular Msg Frontend" "The SPA encrypts and sends messages and does the video calls." tag "Browser"
        				angularFrontendGames = component "Angular Games Module" "The games module provides the Bingo game frontend for the players." tag "Browser"
        			}        	
        			group "Backend" {        	            	
        				backendJwtTokenFilters = component "Jwt Token Filter" "Provide the security based on Jwt Tokens."
        				backendAuthController = component "Auth Controller" "Provides the rest interfaces for Login / Signin / Logout."
        				backendMessageVideoControllers = component "Message/Video Controllers" "Provides the rest interfaces for Contacts / Messages / Calls."
        				backendBingoController = component "Bingo Controller" "Provides the rest interface for the Bingo game."
        				backendWebSocketHandler = component "Video call Websocket handler" "Provides Websocket endpoint to support for Video calls."
        				backendAuthService = component "Auth Service" "Provides the logic for  login / signin / logout."
        				backendMessageVideoService = component "Message/Video Services" "Provides the logic for Contacts / Messages / Calls."
        				backendBingoService = component "Bingo Service" "Provides the logic for the Bingo game."
        				backendRepository = component "MongoDb Repository" "Repository that loads / stores the data."
        			}
        		}
        	}
        	database = container "MongoDb" "MongoDb stores all the data of the system in documents." tag "Database"
        }
	
	    # relationships people / software systems
        user -> angularPwaMessengerSystem "Communicates"
        player -> angularPwaMessengerSystem "Plays"
        
        # relationships containers
        user -> angularPwaMessengerFrontend "send messages / do video calls"
        player -> angularPwaMessengerFrontend "play games"
        angularPwaMessengerFrontend -> angularPwaMessengerBackend 
        angularPwaMessengerBackend -> database
        
        # relationships components
        angularFrontend -> angularFrontendGames "lazy loaded module"
        angularFrontend -> backendAuthController "rest requests"
        angularFrontend -> backendMessageVideoControllers "rest requests"
        angularFrontend -> backendWebSocketHandler "websocket messages"
        angularFrontendGames -> backendBingoController "rest requests"
        backendAuthController -> backendJwtTokenFilters
        backendMessageVideoControllers -> backendJwtTokenFilters
        backendWebSocketHandler -> backendJwtTokenFilters
        backendBingoController -> backendJwtTokenFilters
        backendAuthController -> backendAuthService
        backendMessageVideoControllers -> backendMessageVideoService
        backendBingoController -> backendBingoService
        backendBingoService -> backendRepository "store / read data"
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
        
        component angularPwaMessengerBackend "Components" {
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