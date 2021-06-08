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

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.xxx.messenger.domain.model.AuthCheck;
import ch.xxx.messenger.domain.model.MsgUser;
import ch.xxx.messenger.usecase.service.AuthenticationService;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/rest/auth")
public class AuthenticationController {
	private static final Logger LOG = LoggerFactory.getLogger(AuthenticationController.class);

	private final AuthenticationService authenticationService; 
	
	public AuthenticationController(AuthenticationService authenticationService) {
		this.authenticationService = authenticationService;
	}

	@PostMapping("/authorize")
	public Mono<AuthCheck> postAuthorize(@RequestBody AuthCheck authcheck, @RequestHeader Map<String, String> header) {
		return this.authenticationService.authorizeUser(authcheck, header);
	}

	@PostMapping("/signin")
	public Mono<MsgUser> postUserSignin(@RequestBody MsgUser myUser) {
		return this.authenticationService.userSignin(myUser);		
	}

	@GetMapping("/confirm/{uuid}")
	public Mono<Boolean> getConfirmUuid(@PathVariable String uuid) {
		return this.authenticationService.getConfirmUuid(uuid);
	}

	@PostMapping("/login")
	public Mono<MsgUser> postUserLogin(@RequestBody MsgUser myUser) {		
			return this.authenticationService.userLogin(myUser);
	}
}
