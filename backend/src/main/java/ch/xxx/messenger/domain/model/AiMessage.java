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
package ch.xxx.messenger.domain.model;

import java.util.HashMap;
import java.util.Map;

import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.MessageType;

public class AiMessage implements Message {
	private String content;
	private Map<String,Object> properties = new HashMap<>();
	private MessageType messageType;
	
	public AiMessage() {}
	
	public AiMessage(String content, Map<String,Object> properties, String messageType) {
		this.content = content;
		this.properties = properties != null ? properties : this.properties;
		this.messageType = MessageType.fromValue(messageType);
	}

	public void setContent(String content) {
		this.content = content;
	}

	public void setProperties(Map<String, Object> properties) {
		this.properties = properties;
	}

	public void setMessageType(MessageType messageType) {
		this.messageType = messageType;
	}

	@Override
	public String getContent() {
		return this.content;
	}

	@Override
	public MessageType getMessageType() {
		return this.messageType;
	}

	@Override
	public Map<String, Object> getMetadata() {
		return this.properties;
	}


}
