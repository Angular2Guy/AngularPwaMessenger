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

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.xxx.messenger.domain.model.Contact;
import ch.xxx.messenger.domain.model.Message;
import ch.xxx.messenger.domain.model.SyncMsgs;
import ch.xxx.messenger.usecase.service.MessageService;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/rest/message")
public class MessageController {

	private final MessageService messageService;

	public MessageController(MessageService messageService) {
		this.messageService = messageService;
	}

	@PostMapping("/findMsgs")
	public Flux<Message> getFindMessages(@RequestBody SyncMsgs syncMsgs) {
		return this.messageService.findMessages(syncMsgs);
	}

	@PostMapping("/receivedMsgs")
	public Flux<Message> getReceivedMessages(@RequestBody Contact contact) {
		return this.messageService.receivedMessages(contact);
	}

	@PostMapping("/storeMsgs")
	public ResponseEntity<Flux<Message>> putStoreMessages(@RequestBody SyncMsgs syncMsgs) {
		return this.messageService.storeMessages(syncMsgs);		
	}
}
