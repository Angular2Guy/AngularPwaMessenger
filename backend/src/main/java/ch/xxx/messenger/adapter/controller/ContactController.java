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
package ch.xxx.messenger.adapter.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.xxx.messenger.domain.model.Contact;
import ch.xxx.messenger.domain.model.ContactUpdate;
import ch.xxx.messenger.usecase.service.ContactService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/rest/contact")
public class ContactController {
	private final ContactService contactService;

	public ContactController(ContactService contactService) {
		this.contactService = contactService;
	}

	@PostMapping("/findcontacts")
	public Flux<Contact> getFindContacts(@RequestBody Contact contact) {
		return this.contactService.findContacts(contact);
	}

	@PostMapping("/updatecontacts")
	public Mono<Boolean> postUpdateContacts(@RequestBody ContactUpdate contactUpdate) {
		return this.contactService.updateContacts(contactUpdate);
	}

}
