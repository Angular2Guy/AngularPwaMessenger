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
package ch.xxx.messenger.usecase.service;

import javax.validation.Valid;

import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import ch.xxx.messenger.domain.model.Contact;
import ch.xxx.messenger.domain.model.MsgUser;
import reactor.core.publisher.Flux;

@Service
public class ContactService {
	private final MyMongoRepository myMongoRepository; 
	
	public ContactService(MyMongoRepository myMongoRepository) {
		this.myMongoRepository = myMongoRepository;
	}
	
	public Flux<Contact> findContacts(@Valid Contact contact) {
		return this.myMongoRepository
				.find(new Query().addCriteria(
						Criteria.where("username").regex(String.format(".*%s.*", contact.getName()))), MsgUser.class)
				.take(50).map(myUser -> new Contact(myUser.getUsername(), myUser.getBase64Avatar(),
						myUser.getPublicKey(), myUser.getId().toString()));
	}
}
