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
package ch.xxx.messenger.usecase.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isA;

import java.util.Date;
import java.util.List;

import org.bson.types.ObjectId;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import ch.xxx.messenger.domain.model.Message;
import ch.xxx.messenger.domain.model.SyncMsgs;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@ExtendWith(SpringExtension.class)
public class MessageServiceTest {
	@Mock
	private MyMongoRepository myMongoRepository;
	@InjectMocks
	private MessageService messageService;
	
	@SuppressWarnings("unchecked")
	@Test
	public void findMessagesFound() throws Exception {
		Message myMessage = this.createMessage();
		Mockito.when(this.myMongoRepository.find(isA(Query.class), any(Class.class))).thenReturn(Flux.fromIterable(List.of(myMessage)));
		Mockito.when(this.myMongoRepository.save(isA(Message.class))).thenReturn(Mono.just(myMessage));
		SyncMsgs mySyncMsgs = this.createSyncMsgs();
		List<Message> messages = this.messageService.findMessages(mySyncMsgs).collectList().block();
		Assertions.assertFalse(messages.isEmpty());
		Assertions.assertEquals(myMessage.getId(), messages.get(0).getId());
		Assertions.assertEquals(myMessage.getText(), messages.get(0).getText());
	}
	
	@SuppressWarnings("unchecked")
	@Test
	public void findMessagesNotFound() throws Exception {		
		Mockito.when(this.myMongoRepository.find(isA(Query.class), any(Class.class))).thenReturn(Flux.fromIterable(List.of()));
		Mockito.when(this.myMongoRepository.save(isA(Message.class))).thenReturn(Mono.empty());
		SyncMsgs mySyncMsgs = this.createSyncMsgs();
		List<Message> messages = this.messageService.findMessages(mySyncMsgs).collectList().block();
		Assertions.assertTrue(messages.isEmpty());
	}
	
	private SyncMsgs createSyncMsgs() {
		SyncMsgs syncMsgs = new SyncMsgs();
		syncMsgs.setContactIds(List.of());
		syncMsgs.setLastUpdate(new Date());
		syncMsgs.setMsgs(List.of());
		syncMsgs.setOwnId("XXX");
		return syncMsgs;
	}
	
	private Message createMessage() {
		Message message = new Message();
		message.setText("XXX");
		message.setId(new ObjectId());
		return message;
	}
}
