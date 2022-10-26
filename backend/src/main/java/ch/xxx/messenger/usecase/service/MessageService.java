
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

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.LinkedList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.LongStream;

import javax.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import ch.xxx.messenger.domain.exception.TooManyMsgException;
import ch.xxx.messenger.domain.model.Contact;
import ch.xxx.messenger.domain.model.Message;
import ch.xxx.messenger.domain.model.SyncMsgs;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class MessageService {
	private static final Logger LOG = LoggerFactory.getLogger(MessageService.class);
	private static final int MB = 1024 * 1024;

	private final MyMongoRepository myMongoRepository;

	public MessageService(MyMongoRepository myMongoRepository) {
		this.myMongoRepository = myMongoRepository;
	}

	public Flux<Message> findMessages(@Valid SyncMsgs syncMsgs) {
		return this.myMongoRepository
				.find(new Query().addCriteria(Criteria.where("fromId").in(syncMsgs.getContactIds())
						.orOperator(Criteria.where("toId").is(syncMsgs.getOwnId())
								.andOperator(Criteria.where("timestamp").gt(syncMsgs.getLastUpdate())))),
						Message.class)
				.map(msg -> {
					msg.setReceived(true);
					return msg;
				}).flatMap(msg -> this.myMongoRepository.save(msg));
	}

	public Flux<Message> receivedMessages(@Valid Contact contact) {
		final List<Message> msgToDelete = new LinkedList<>();
		return this.myMongoRepository.find(new Query().addCriteria(
				Criteria.where("fromId").is(contact.getUserId()).andOperator(Criteria.where("received").is(true))),
				Message.class).flatMap(msg -> {
					msgToDelete.add(msg);
					return this.myMongoRepository.remove(msg);
				}).flatMapIterable(result -> msgToDelete);
	}

	public void cleanUpMessages(Long messageTtl) {
		LOG.info("CleanUpOldMessages started.");
		Date removeTimestamp = Date.from(LocalDateTime.now().minusDays(messageTtl)
				.toInstant(ZoneOffset.systemDefault().getRules().getOffset(Instant.now())));
		this.myMongoRepository
				.findAllAndRemove(new Query().addCriteria(Criteria.where("timestamp").lt(removeTimestamp)),
						Message.class)
				.collectList().block();
		LOG.info("CleanUpOldMessages finished.");
	}

	public ResponseEntity<Flux<Message>> storeMessages(@Valid SyncMsgs syncMsgs) {
		List<Message> msgs = syncMsgs.getMsgs().stream().map(msg -> {
			msg.setSend(true);
			msg.setTimestamp(new Date());
			return msg;
		}).filter(msg -> msg.getText() != null && !msg.getText().isBlank()).filter(
				msg -> msg.getFilename() == null || (msg.getFilename() != null && msg.getText().length() < 3 * MB))
				.collect(Collectors.toList());
		Flux<Message> msgsFlux = this.myMongoRepository
				.find(new Query().addCriteria(Criteria.where("fromId").is(syncMsgs.getOwnId())), Message.class)
				.collectList().flatMap(messages -> sizeOfMessages(messages, syncMsgs.getOwnId())).flux()
				.flatMap(value -> this.myMongoRepository.insertAll(msgs));
		return syncMsgs.getMsgs().size() > msgs.size()
				? ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(msgsFlux)
				: ResponseEntity.ok(msgsFlux);
	}

	private Mono<Long> sizeOfMessages(List<Message> messages, String ownerId) {
		long msgsSizeSum = messages.stream()
				.flatMapToLong(message -> message.getText() == null ? LongStream.of(0L)
						: LongStream.of(Long.valueOf(message.getText().length())))
				.reduce(0, (collect, newLength) -> collect + newLength);
		if (msgsSizeSum > 15 * MB) {
			throw new TooManyMsgException(String.format("MsgSizeSum for User %s is %d", ownerId, msgsSizeSum));
		}
		return Mono.just(msgsSizeSum);
	}
}
