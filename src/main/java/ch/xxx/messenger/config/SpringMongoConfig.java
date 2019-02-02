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
package ch.xxx.messenger.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractReactiveMongoConfiguration;

import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoClients;

@Configuration
public class SpringMongoConfig extends AbstractReactiveMongoConfiguration {
	private static final Logger log = LoggerFactory.getLogger(SpringMongoConfig.class);
	
    @Value("${spring.data.mongodb.host}")
    private String mongoHost;

    @Value("${spring.data.mongodb.port}")
    private String mongoPort;

    @Value("${spring.data.mongodb.database}")
    private String mongoDB;

	@Override
	protected String getDatabaseName() {
		return mongoDB;
	}

	@Override
	public MongoClient reactiveMongoClient() {
		String myHost = System.getenv("MONGODB_HOST");		
		log.info("MONGODB_HOST="+myHost);			
		return MongoClients.create("mongodb://"+(myHost==null ? mongoHost : myHost)+":"+mongoPort);
	}	

}
