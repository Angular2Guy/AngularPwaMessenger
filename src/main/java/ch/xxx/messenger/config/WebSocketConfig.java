package ch.xxx.messenger.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;

import ch.xxx.messenger.controller.ReactiveWebSocketHandler;

@Configuration
public class WebSocketConfig {
	@Autowired
	private ReactiveWebSocketHandler webSocketHandler;
	
	@Bean
	public HandlerMapping webSocketHandlerMapping() {
	    Map<String, ReactiveWebSocketHandler> map = new HashMap<>();
	    map.put("/event-emitter", webSocketHandler);
	 
	    SimpleUrlHandlerMapping handlerMapping = new SimpleUrlHandlerMapping();
	    handlerMapping.setOrder(1);
	    handlerMapping.setUrlMap(map);
	    return handlerMapping;
	}
	
}
