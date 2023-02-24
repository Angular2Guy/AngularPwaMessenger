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
package ch.xxx.messenger.adapter.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.mongo.MongoProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.http.codec.support.DefaultServerCodecConfigurer;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoClients;

import jakarta.annotation.PostConstruct;

@Configuration
@EnableScheduling
public class SpringMongoConfig {
	private static final Logger LOGGER = LoggerFactory.getLogger(SpringMongoConfig.class);
	
    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;
    
    private final MongoMappingContext mongoMappingContext;
    private final MongoProperties mongoProperties;
    
    public SpringMongoConfig(MongoMappingContext mongoMappingContext, MongoProperties mongoProperties) {
    	this.mongoMappingContext = mongoMappingContext;
    	this.mongoProperties = mongoProperties;
    }

    @PostConstruct
    public void init() {
		LOGGER.info("MongoUri={}", this.mongoUri);
    	this.mongoMappingContext.setAutoIndexCreation(true);
    	LOGGER.info("Mongo AutoIndexCreation: {}", this.mongoMappingContext.isAutoIndexCreation());
    }
    

	@Bean
	public MongoClient mongoClient() {
//		LOGGER.info("MongoPort: {}", this.mongoProperties.getPort());
//		LOGGER.info("MongoUri: {}", this.mongoUri.replace("27027",
//				this.mongoProperties.getPort() == null ? "27027" : this.mongoProperties.getPort().toString()));
		return MongoClients.create(this.mongoUri.replace("27027",
				this.mongoProperties.getPort() == null ? "27027" : this.mongoProperties.getPort().toString()));
	}
    
    @Bean
	public ServerCodecConfigurer serverCodecConfigurer() {
		return new DefaultServerCodecConfigurer();
	}
}
