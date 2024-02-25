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

import org.springframework.ai.chat.ChatResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.xxx.messenger.domain.model.AiConfig;
import ch.xxx.messenger.domain.model.AiMessage;
import ch.xxx.messenger.usecase.service.AiFriendService;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/rest/aifriend")
public class AiFriendController {
	private AiFriendService aiFriendService;
	
	public AiFriendController(AiFriendService aiFriendService) {
		this.aiFriendService = aiFriendService;
	}
	
	@GetMapping("/config")
	public AiConfig getAiConfig() {
		return this.aiFriendService.createAiConfig();
	}
	
	@PostMapping("/talk")
	public Flux<ChatResponse> talkToSam(@RequestBody AiMessage aiMessage) {
		return this.aiFriendService.talkToSam(aiMessage);
	}
}
