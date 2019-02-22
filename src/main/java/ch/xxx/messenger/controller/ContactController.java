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
package ch.xxx.messenger.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.xxx.messenger.dto.Contact;
import ch.xxx.messenger.dto.MsgUser;
import ch.xxx.messenger.jwt.JwtTokenProvider;
import ch.xxx.messenger.jwt.Role;
import ch.xxx.messenger.utils.Tuple;
import ch.xxx.messenger.utils.WebUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/rest/contact")
public class ContactController {
	@Autowired
	private ReactiveMongoOperations operations;
	@Autowired
	private JwtTokenProvider jwtTokenProvider;

	@PostMapping("/findcontacts")
	public Flux<Contact> getFindContacts(@RequestBody Contact contact,  @RequestHeader Map<String, String> header) {
		Tuple<String, String> tokenTuple = WebUtils.getTokenUserRoles(header, jwtTokenProvider);
		if (tokenTuple.getB().contains(Role.USERS.name()) && !tokenTuple.getB().contains(Role.GUEST.name())) {
			return operations.find(new Query()
					.addCriteria(Criteria.where("username")
					.regex(String.format(".*%s.*", contact.getName()))), MsgUser.class)
					.take(50)
					.map(myUser -> new Contact(myUser.getUsername(), myUser.getBase64Avatar(), myUser.getBase64PublicKey()));
		}
		return Flux.empty();
	}

	@GetMapping("/mycontacts")
	public Flux<Contact> getContacts(@RequestHeader Map<String, String> header) {
		Tuple<String, String> tokenTuple = WebUtils.getTokenUserRoles(header, jwtTokenProvider);
		if (tokenTuple.getB().contains(Role.USERS.name()) && !tokenTuple.getB().contains(Role.GUEST.name())) {
			return operations
					.findOne(new Query().addCriteria(Criteria.where("username").is(tokenTuple.getA())), MsgUser.class)
					.flatMapMany(myUser -> operations
							.find(new Query().addCriteria(Criteria.where("_id").in(myUser.getContacts())), MsgUser.class)
							.map(myUser1 -> new Contact(myUser1.getUsername(), myUser1.getBase64Avatar(),
									myUser1.getBase64PublicKey())));

		}
		return Flux.empty();
	}

	@PutMapping("/mycontact")
	public Mono<MsgUser> putContact(@RequestBody Contact contact, @RequestHeader Map<String, String> header) {
		Tuple<String, String> tokenTuple = WebUtils.getTokenUserRoles(header, jwtTokenProvider);
		if (tokenTuple.getB().contains(Role.USERS.name()) && !tokenTuple.getB().contains(Role.GUEST.name())) {
			operations.findOne(new Query().addCriteria(Criteria.where("username").is(tokenTuple.getA())), MsgUser.class)
					.flatMap(me -> operations
							.findOne(new Query().addCriteria(Criteria.where("username").is(contact.getName())),
									MsgUser.class)
							.flatMap(newContact -> {
								if (!me.getContacts().contains(newContact.get_id())) {
									me.getContacts().add(newContact.get_id());
									return operations.save(me);
								}
								return Mono.empty();
							}));
			return Mono.empty();
		}
		return Mono.empty();
	}
}
