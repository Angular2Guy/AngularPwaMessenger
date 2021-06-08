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

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.xxx.messenger.adapter.config.JwtTokenProvider;
import ch.xxx.messenger.domain.common.Role;
import ch.xxx.messenger.domain.common.WebUtils;
import ch.xxx.messenger.domain.model.AuthCheck;
import ch.xxx.messenger.domain.model.MsgUser;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/rest/auth")
public class AuthenticationController {
	private static final Logger LOG = LoggerFactory.getLogger(AuthenticationController.class);

	private final PasswordEncoder passwordEncoder;
	private final ReactiveMongoOperations operations;
	private final JwtTokenProvider jwtTokenProvider;
	private final JavaMailSender javaMailSender;
	@Value("${spring.mail.username}")
	private String mailuser;
	@Value("${spring.mail.password}")
	private String mailpwd;
	@Value("${messenger.url.uuid.confirm}")
	private String confirmUrl;
	
	public AuthenticationController(PasswordEncoder passwordEncoder, ReactiveMongoOperations operations, JwtTokenProvider jwtTokenProvider, JavaMailSender javaMailSender) {
		this.passwordEncoder = passwordEncoder; 
		this.operations = operations;
		this.jwtTokenProvider = jwtTokenProvider;
		this.javaMailSender = javaMailSender;
	}

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
		try {
		Query query = new Query();
		query.addCriteria(Criteria.where("username").is(myUser.getUsername()));
		MsgUser user = this.operations.findOne(query, MsgUser.class).switchIfEmpty(Mono.just(new MsgUser())).block();
		if (user.getUsername() == null) {
			String encryptedPassword = this.passwordEncoder.encode(myUser.getPassword());
			myUser.setPassword(encryptedPassword);
			UUID uuid = UUID.randomUUID();
			myUser.setUuid(uuid.toString());
			this.operations.save(myUser).block();
			this.sendConfirmMail(myUser);
			myUser.setUserId(myUser.getId().toString());
			myUser.setUuid(null);
			return Mono.just(myUser);
		}
		} catch(RuntimeException re) {
			LOG.error("signin failed for: "+myUser.getUsername());
		}
		return Mono.just(new MsgUser());
	}

	private void sendConfirmMail(MsgUser myUser) {
		if (this.confirmUrl != null && !this.confirmUrl.isBlank()) {
			SimpleMailMessage msg = new SimpleMailMessage();
			msg.setTo(myUser.getEmail());
			msg.setSubject("AngularPwaMessenger Account Confirmation Mail");
			String url = this.confirmUrl + "/" + myUser.getUuid();
			msg.setText(String.format(
					"Welcome to the AngularPwaMessenger please use this link(%s) to confirm your account.", url));
			this.javaMailSender.send(msg);
			LOG.info("Confirm Mail send to: "+myUser.getEmail());
		}
	}

	@GetMapping("/confirm/{uuid}")
	public Mono<Boolean> getConfirmUuid(@PathVariable String uuid) {
		Query query = new Query();
		query.addCriteria(Criteria.where("uuid").is(uuid));
		query.addCriteria(Criteria.where("confirmed").is(false));
		return this.operations.findOne(query, MsgUser.class).switchIfEmpty(Mono.just(new MsgUser())).flatMap(user -> {
			if (user.getUuid() != null && user.getUuid().equalsIgnoreCase(uuid)) {
				user.setConfirmed(true);
				return operations.save(user);
			}
			return Mono.just(user);
		}).map(user -> user.isConfirmed());
	}

	@PostMapping("/login")
	public Mono<MsgUser> postUserLogin(@RequestBody MsgUser myUser) {
			Query query = new Query();
			query.addCriteria(Criteria.where("username").is(myUser.getUsername()));
			if (this.confirmUrl != null && !this.confirmUrl.isBlank()) {
				query.addCriteria(Criteria.where("confirmed").is(true));
			}
			return this.operations.findOne(query, MsgUser.class).switchIfEmpty(Mono.just(new MsgUser())).map(user1 -> {
				if(user1.getId() != null) user1.setUserId(user1.getId().toString());
				return user1;
			}).map(user1 -> loginHelp(user1, myUser.getPassword())).onErrorResume(re -> {
				LOG.info("login failed for: "+myUser.getUsername(),re);
				return Mono.just(new MsgUser());
			});
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
