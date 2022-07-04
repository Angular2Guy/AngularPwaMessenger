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
package ch.xxx.messenger.adapter.handler;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import ch.xxx.messenger.domain.common.JwtTokenProvider;
import ch.xxx.messenger.domain.common.Role;

@Component
public class SignalingHandler extends TextWebSocketHandler {
	private static final Logger LOGGER = LoggerFactory.getLogger(SignalingHandler.class);
	private JwtTokenProvider jwtTokenProvider;
	private List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

	private record SenderReceiver(String sender, String receiver) {
	}

	public SignalingHandler(JwtTokenProvider jwtTokenProvider) {
		this.jwtTokenProvider = jwtTokenProvider;
	}

	@Override
	public void handleTextMessage(WebSocketSession session, TextMessage message)
			throws InterruptedException, IOException {
		if (userRoleCheck(session)) {
			SenderReceiver senderReceiver = this.extractSenderReceiver(message);
			String sessionUsername = extractSessionUsername(session);
			for (WebSocketSession webSocketSession : this.sessions) {
				removeStaleSession(webSocketSession);
				String webSocketSessionUsername = this.extractSessionUsername(webSocketSession);
				LOGGER.info("Msg sender: {}, Msg receiver: {}, Session sender: {}, WebSocket receiver: {}",
						senderReceiver.sender, senderReceiver.receiver, sessionUsername, webSocketSessionUsername);
				if (webSocketSession.isOpen() && senderReceiver.sender.equalsIgnoreCase(sessionUsername)
						&& senderReceiver.receiver.equalsIgnoreCase(webSocketSessionUsername)) {
					LOGGER.info("Msg send: {}",message.getPayload());
					webSocketSession.sendMessage(message);
				}
			}
		} else {
			if (this.isTokenExpired(session)) {
				session.close();
			}
		}
	}

	private String extractSessionUsername(WebSocketSession session) {
		return this.extractToken(session).stream().map(myToken -> this.jwtTokenProvider.getUsername(myToken)).findAny()
				.orElseThrow(() -> new RuntimeException("Session token username not found"));
	}

	private SenderReceiver extractSenderReceiver(TextMessage message) {
		List<String> fragments = List.of(message.getPayload().split("\\,"));
		String senderId = fragments.stream().filter(myFragment -> myFragment.contains("senderId")).findAny().stream()
				.map(myFragment -> myFragment.split("\\:")[1].replace('"', ' ').trim()).findFirst()
				.orElseThrow(() -> new RuntimeException("SenderId not found in message"));
		String receiverId = fragments.stream().filter(myFragment -> myFragment.contains("receiverId")).findAny()
				.stream().map(myFragment -> myFragment.split("\\:")[1].replace('"', ' ').trim()).findFirst()
				.orElseThrow(() -> new RuntimeException("ReceiverId not found in message"));
		return new SenderReceiver(senderId, receiverId);
	}

	private void removeStaleSession(WebSocketSession webSocketSession) throws IOException {
		if (!this.extractToken(webSocketSession).stream()
				.anyMatch(myToken -> this.jwtTokenProvider.validateToken(myToken))) {
			webSocketSession.close();
		}
	}

	private boolean isTokenExpired(WebSocketSession session) {
		Optional<String> optionalToken = extractToken(session);
		return optionalToken.stream().allMatch(myToken -> 0 >= this.jwtTokenProvider.getTtl(myToken));
	}

	private boolean userRoleCheck(WebSocketSession session) {
		Optional<String> optionalToken = extractToken(session);
		// LOGGER.info(token);
		return optionalToken.stream().filter(myToken -> this.jwtTokenProvider.validateToken(myToken))
				.anyMatch(myToken -> this.jwtTokenProvider.getAuthorities(myToken).stream()
						.anyMatch(myRole -> Role.USERS.equals(myRole)));
	}

	private Optional<String> extractToken(WebSocketSession session) {
		String[] tokens = session.getUri().getQuery().split("token=");
		return tokens.length > 1 ? Optional.ofNullable(tokens[1]) : Optional.empty();
	}

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		if (userRoleCheck(session)) {
			this.sessions.add(session);
		}
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		this.sessions.remove(session);
	}
}