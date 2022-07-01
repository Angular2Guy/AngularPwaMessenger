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
public class SocketHandler extends TextWebSocketHandler {
	private static final Logger LOGGER = LoggerFactory.getLogger(SocketHandler.class);
	private JwtTokenProvider jwtTokenProvider;
	private List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

	public SocketHandler(JwtTokenProvider jwtTokenProvider) {
		this.jwtTokenProvider = jwtTokenProvider;
	}

	@Override
	public void handleTextMessage(WebSocketSession session, TextMessage message)
			throws InterruptedException, IOException {
		if (userRoleCheck(session)) {
			for (WebSocketSession webSocketSession : this.sessions) {
				if (webSocketSession.isOpen() && session.getId().equals(webSocketSession.getId())) {
					webSocketSession.sendMessage(message);
				}
			}
		}
	}

	private boolean userRoleCheck(WebSocketSession session) {
		String token = session.getUri().getQuery().split("token=")[1];
		// LOGGER.info(token);
		boolean isUser = this.jwtTokenProvider.getAuthorities(token).stream()
				.anyMatch(myRole -> Role.USERS.equals(myRole));
		return isUser;
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