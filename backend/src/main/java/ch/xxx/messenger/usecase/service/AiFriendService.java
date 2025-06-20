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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.StreamingChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import ch.xxx.messenger.domain.model.AiConfig;
import reactor.core.publisher.Flux;

@Service
public class AiFriendService {
	private static final Logger LOGGER = LoggerFactory.getLogger(AiFriendService.class);
	@Value("${spring.profiles.active:}")
	private String activeProfile;
	@Value("${spring.ai.ollama.chat.options.model:}")
	private String aiModel;
	@Value("${spring.ai.use-chatmemory:true}")
	private boolean useChatMemory;
	private final StreamingChatModel streamingChatClient;
	private final ChatMemory chatMemory;

	public AiFriendService(StreamingChatModel streamingChatClient, ChatMemory chatMemory) {
		this.streamingChatClient = streamingChatClient;
		this.chatMemory = chatMemory;		
	}
	
	public AiConfig createAiConfig() {
		return new AiConfig(this.activeProfile.contains("ollama"), this.aiModel);
	}
	
	public Flux<ChatResponse> talkToSam(UserMessage statement) {
		//LOGGER.info(this.streamingChatClient.stream(statement.getText()).reduce("", (acc, value) -> acc+value).block());
		var conversationId = "" + SecurityContextHolder.getContext().getAuthentication().getName();
		this.chatMemory.add(conversationId,statement);
		var prompt = this.useChatMemory ? new Prompt(this.chatMemory.get(conversationId)) : new Prompt(statement);		
		LOGGER.info("ConversationId: "+conversationId+ ", Prompt.getContent(): "+prompt.getContents());		
		return this.streamingChatClient.stream(prompt);
	}
	
}
