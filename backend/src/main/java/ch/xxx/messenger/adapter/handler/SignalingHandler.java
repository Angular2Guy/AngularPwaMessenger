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

import java.util.LinkedList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;

import ch.xxx.messenger.adapter.handler.model.SignalData;
import ch.xxx.messenger.adapter.handler.model.SignalType;


public class SignalingHandler extends TextWebSocketHandler{
	List<WebSocketSession>sessions = new LinkedList<WebSocketSession>();
	ConcurrentHashMap<String,WebSocketSession>sessionMap = new ConcurrentHashMap<String,WebSocketSession>();
	final ObjectMapper map1=new ObjectMapper();
	Logger log1=LoggerFactory.getLogger(SignalingHandler.class);

	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {

		final String  msg1=message.getPayload();
		SignalData sigData=map1.readValue(msg1, SignalData.class);
		log1.debug("Receive message from client:",msg1);

		SignalData sigResp=new SignalData();

		if(sigData.getType().equalsIgnoreCase(SignalType.Login.toString()))	{
			SignalData sigResp2=new SignalData();
			String userId=UUID.randomUUID().toString();
			sigResp2.setUserId("signaling");
			sigResp2.setType(SignalType.UserId.toString());
			sigResp2.setData(userId);
			sessionMap.put(userId, session);
			session.sendMessage(new TextMessage(map1.writeValueAsString(sigResp2)));

			return ;
		}
		else if(sigData.getType().equalsIgnoreCase(SignalType.NewMember.toString()))	{

			sessionMap.values().forEach(a->{

				SignalData sigResp2=new SignalData();
				sigResp2.setUserId(sigData.getUserId());
				sigResp2.setType(SignalType.NewMember.toString());			
				try	{
					//Check if websocket is open
					if(a.isOpen())	{
						log1.debug("Sending New Member from",sigData.getUserId());
						a.sendMessage(new TextMessage(map1.writeValueAsString(sigResp2)));
					}
				}
				catch(Exception e)	{
					log1.error("Error Sending message:",e);
				}
			});

			
			return ;
		}
		else if(sigData.getType().equalsIgnoreCase(SignalType.Offer.toString()))	{
			sigResp=new SignalData();
			sigResp.setUserId(sigData.getUserId());
			sigResp.setType(SignalType.Offer.toString());
			sigResp.setData(sigData.getData());
			sigResp.setToUid(sigData.getToUid());
			sessionMap.get(sigData.getToUid()).sendMessage(new TextMessage(map1.writeValueAsString(sigResp)));
			

		}
		else if(sigData.getType().equalsIgnoreCase(SignalType.Answer.toString()))	{
			sigResp=new SignalData();
			sigResp.setUserId(sigData.getUserId());
			sigResp.setType(SignalType.Answer.toString());
			sigResp.setData(sigData.getData());
			sigResp.setToUid(sigData.getToUid());
			sessionMap.get(sigData.getToUid()).sendMessage(new TextMessage(map1.writeValueAsString(sigResp)));
			

		}
		else if(sigData.getType().equalsIgnoreCase(SignalType.Ice.toString()))	{
			sigResp=new SignalData();
			sigResp.setUserId(sigData.getUserId());
			sigResp.setType(SignalType.Ice.toString());
			sigResp.setData(sigData.getData());
			sigResp.setToUid(sigData.getToUid());
			sessionMap.get(sigData.getToUid()).sendMessage(new TextMessage(map1.writeValueAsString(sigResp)));
			

		}


	}

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		
		sessions.add(session);
		super.afterConnectionEstablished(session);
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		
		sessions.remove(session);
		super.afterConnectionClosed(session, status);
	}
}