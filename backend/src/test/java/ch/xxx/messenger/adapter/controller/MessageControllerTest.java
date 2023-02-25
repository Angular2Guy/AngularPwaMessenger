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
package ch.xxx.messenger.adapter.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;

import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan.Filter;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import ch.xxx.messenger.adapter.config.WebSecurityConfig;
import ch.xxx.messenger.domain.common.JwtTokenProvider;
import ch.xxx.messenger.domain.common.Role;
import ch.xxx.messenger.domain.common.WebUtils;
import ch.xxx.messenger.domain.model.Message;
import ch.xxx.messenger.domain.model.SyncMsgs;
import ch.xxx.messenger.usecase.service.MessageService;
import reactor.core.publisher.Flux;

@WebMvcTest(controllers = MessageController.class, includeFilters = @Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {
		WebSecurityConfig.class, JwtTokenProvider.class }))
public class MessageControllerTest {
	private static final String TOKEN_KEY = "-naK4ey61mAnF7sYgmT9BDXxqJnYaaPRlCKgbgua77AlwE82_UcE27hCClkiyoaUJUB3g7__0mTkyIpagusnLnZaSVJ--Qh"
			+ "Z4QQF93Tw59tai4JDHf0F8kFvK6XH3pPCMEH15T9GDjoSUMMMoJmI8ErVewJlkczOQANMcNCa1MTfoto1Y2Hi5GvSo2muazKNkM6Rv8tJwI_xBJjWeY3QcR9Pgp08a"
			+ "k5ATXy4D-9X_pA_TtrR2UAqkOu6q2INcixonOvRCW3xgDwj9fO246DYetlHBV6ClLhv1xDnlX86Vi7Bopt7DbmNRyNILUlBmI3zqaFh4rgSQJGvIyRiliQbqg==";
	@MockBean
	private MessageService messageService;
	@Autowired
	private JwtTokenProvider jwtTokenProvider;
	@Autowired
	private ObjectMapper objectMapper;
	@Autowired
	private MockMvc mockMvc;

	@BeforeEach
	public void init() {
		ReflectionTestUtils.setField(this.jwtTokenProvider, "validityInMilliseconds", 60000);
		ReflectionTestUtils.setField(this.jwtTokenProvider, "secretKey", TOKEN_KEY);
	}

	@Test
	public void findMessagesFound() throws Exception {
		Message message = this.createMessage();
		Mockito.when(this.messageService.findMessages(any(SyncMsgs.class))).thenReturn(Flux.fromIterable(List.of()));
		String myToken = this.jwtTokenProvider.createToken("XXX", List.of(Role.USERS), Optional.empty());
		this.mockMvc
				.perform(post("/rest/message/findMsgs").accept(MediaType.APPLICATION_JSON)
						.header(WebUtils.AUTHORIZATION, String.format("Bearer %s", myToken))
						.contentType(MediaType.APPLICATION_JSON)
						.servletPath("/rest/message/findMsgs").content(this.objectMapper.writeValueAsString(message)))
				.andExpect(status().isOk());
	}

	private Message createMessage() {
		Message message = new Message();
		message.setId(new ObjectId());
		message.setText("XXX");
		return message;
	}
}
