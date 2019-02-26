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
package ch.xxx.messenger.controller;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.xxx.messenger.dto.AuthCheck;
import ch.xxx.messenger.dto.MsgUser;
import ch.xxx.messenger.jwt.JwtTokenProvider;
import ch.xxx.messenger.jwt.Role;
import ch.xxx.messenger.utils.WebUtils;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/rest/auth")
public class AuthenticationController {
	@Autowired
	private PasswordEncoder passwordEncoder;
	@Autowired
	private ReactiveMongoOperations operations;
	@Autowired
	private JwtTokenProvider jwtTokenProvider;

	@PostMapping("/authorize")
	public Mono<AuthCheck> postAuthorize(@RequestBody AuthCheck authcheck, @RequestHeader Map<String, String> header) {
		String tokenRoles = WebUtils.getTokenRoles(header, jwtTokenProvider);
		if (tokenRoles.contains(Role.USERS.name()) && !tokenRoles.contains(Role.GUEST.name())) {
			return Mono.just(new AuthCheck(authcheck.getPath(), true));
		} else {
			return Mono.just(new AuthCheck(authcheck.getPath(), false));
		}
	}

	@PostMapping("/signin")
	public Mono<MsgUser> postUserSignin(@RequestBody MsgUser myUser) {
		Query query = new Query();
		query.addCriteria(Criteria.where("username").is(myUser.getUsername()));
		MsgUser user = this.operations.findOne(query, MsgUser.class).switchIfEmpty(Mono.just(new MsgUser())).block();
		if (user.getUsername() == null) {
			String encryptedPassword = this.passwordEncoder.encode(myUser.getPassword());
			myUser.setPassword(encryptedPassword);
			this.operations.save(myUser).block();	
			myUser.setUserId(myUser.get_id().toString());
			return Mono.just(myUser);
		}
		return Mono.just(new MsgUser());
	}

	@PostMapping("/login")
	public Mono<MsgUser> postUserLogin(@RequestBody MsgUser myUser) {
		Query query = new Query();
		query.addCriteria(Criteria.where("username").is(myUser.getUsername()));
		return this.operations.findOne(query, MsgUser.class).switchIfEmpty(Mono.just(new MsgUser()))
				.map(user1 -> { user1.setUserId(user1.get_id().toString());
								return user1;})
				.map(user1 -> loginHelp(user1, myUser.getPassword()));
	}

	private MsgUser loginHelp(MsgUser user, String passwd) {
		if (user.getUsername() != null) {
			if (this.passwordEncoder.matches(passwd, user.getPassword())) {
				String jwtToken = this.jwtTokenProvider.createToken(user.getUsername(), Arrays.asList(Role.USERS),
						Optional.empty());
				user.setToken(jwtToken);
				user.setPassword("XXX");
				return user;
			}
		}
		return new MsgUser();
	}
}
