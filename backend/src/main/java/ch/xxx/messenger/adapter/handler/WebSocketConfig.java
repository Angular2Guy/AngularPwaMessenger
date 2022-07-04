/**
 *    Copyright 2018 Sven Loesekann
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
package ch.xxx.messenger.adapter.handler;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistration;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer{
	private SignalingHandler socketHandler;
	private Environment environment;
	
	public WebSocketConfig(SignalingHandler socketHandler, Environment environment) {
		this.socketHandler = socketHandler;
		this.environment = environment;
	}
	
	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		WebSocketHandlerRegistration handlerRegistration = registry.addHandler(this.socketHandler, "/signalingsocket");
		if(List.of(this.environment.getActiveProfiles()).stream().noneMatch(myProfile -> myProfile.toLowerCase().contains("prod"))) {
			handlerRegistration.setAllowedOrigins("*");
		}		
	}
}