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

import java.util.Date;
import java.util.LinkedList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.xxx.messenger.dto.Contact;
import ch.xxx.messenger.dto.Message;
import ch.xxx.messenger.dto.SyncMsgs;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/rest/message")
public class MessageController {
	private static final int MB = 1024 * 1024;
	@Autowired
	private ReactiveMongoOperations operations;

	@PostMapping("/findMsgs")
	public Flux<Message> getFindMessages(@RequestBody SyncMsgs syncMsgs) {
		List<Message> msgToUpdate = new LinkedList<>();
		return operations
				.find(new Query().addCriteria(Criteria.where("fromId").in(syncMsgs.getContactIds())
						.orOperator(Criteria.where("toId").is(syncMsgs.getOwnId())
								.andOperator(Criteria.where("timestamp").gt(syncMsgs.getLastUpdate())))),
						Message.class)
				.doOnEach(msg -> {
					if (msg.hasValue()) {
						msg.get().setReceived(true);
						msgToUpdate.add(msg.get());
					}
				}).doAfterTerminate(() -> msgToUpdate.forEach(msg -> operations.save(msg).block()));
	}

	@PostMapping("/receivedMsgs")
	public Flux<Message> getReceivedMessages(@RequestBody Contact contact) {
		List<Message> msgToDelete = new LinkedList<>();
		return operations.find(new Query().addCriteria(
				Criteria.where("fromId").is(contact.getUserId()).andOperator(Criteria.where("received").is(true))),
				Message.class).doOnEach(msg -> {
					if (msg.hasValue()) {
						msgToDelete.add(msg.get());
					}
				}).doAfterTerminate(() -> msgToDelete.forEach(msg -> operations.remove(msg).block()));
	}

	@PostMapping("/storeMsgs")
	public ResponseEntity<Flux<Message>> putStoreMessages(@RequestBody SyncMsgs syncMsgs) {
		List<Message> msgs = syncMsgs.getMsgs().stream().map(msg -> {
			msg.setSend(true);
			msg.setTimestamp(new Date());
			return msg;
		}).filter(msg -> msg.getFilename() == null || (msg.getFilename() != null && msg.getText().length() < 3 * MB))
				.collect(Collectors.toList());
		return syncMsgs.getMsgs().size() > msgs.size()
				? ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(this.operations.insertAll(msgs))
				: ResponseEntity.ok(this.operations.insertAll(msgs));
	}
}
