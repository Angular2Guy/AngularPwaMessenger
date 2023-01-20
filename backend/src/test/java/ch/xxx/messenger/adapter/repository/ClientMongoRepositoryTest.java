/**
 *    Copyright 2016 Sven Loesekann

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
package ch.xxx.messenger.adapter.repository;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.ComponentScan.Filter;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import ch.xxx.messenger.adapter.config.FlapDoodleConfig;
import ch.xxx.messenger.domain.model.Contact;
import ch.xxx.messenger.usecase.service.MyMongoRepository;

@SpringBootTest	
@ComponentScan(basePackages = "ch.xxx.messenger", includeFilters = @Filter(type = FilterType.ASSIGNABLE_TYPE, classes = FlapDoodleConfig.class))
@TestMethodOrder(OrderAnnotation.class)
public class ClientMongoRepositoryTest {
	private static final String USERNAME = "XXXX";
	@Autowired
	private MyMongoRepository myMongoRepository;
		
	
	@Test
	@Order(1)
	public void saveContact() throws Exception {
		Contact myContact = new Contact(USERNAME, "avatar", "pubkey", "UserId");		
		Contact result = this.myMongoRepository.save(myContact).block();
		Assertions.assertNotNull(result);
		Assertions.assertEquals(USERNAME, result.getName());
	}
	
	@Test
	@Order(2)
	public void loadContactFound() throws Exception {
		Contact result = this.myMongoRepository.find(new Query().addCriteria(
				Criteria.where("name").regex(String.format(".*%s.*", USERNAME))), Contact.class).blockFirst();
		Assertions.assertNotNull(result);
		Assertions.assertEquals(USERNAME, result.getName());
	}
	
	@Test
	@Order(3)
	public void loadContactNotFound() throws Exception {
		Contact result = this.myMongoRepository.find(new Query().addCriteria(
				Criteria.where("username").regex(String.format(".*%s.*", "ABCDE"))), Contact.class).blockFirst();
		Assertions.assertNull(result);
	}
}
