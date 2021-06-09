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

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import ch.xxx.messenger.domain.common.JwtTokenProvider;
import ch.xxx.messenger.domain.common.Role;
import ch.xxx.messenger.domain.common.WebUtils;
import ch.xxx.messenger.domain.model.AuthCheck;
import ch.xxx.messenger.domain.model.MsgUser;
import reactor.core.publisher.Mono;

@Service
public class AuthenticationService {
	private static final Logger LOG = LoggerFactory.getLogger(AuthenticationService.class);
	private final JwtTokenProvider jwtTokenProvider;
	private final PasswordEncoder passwordEncoder;
	private final MailService mailService;
	private final MyMongoRepository myMongoRepository;
	@Value("${messenger.url.uuid.confirm}")
	private String confirmUrl;

	public AuthenticationService(JwtTokenProvider jwtTokenProvider, PasswordEncoder passwordEncoder,
			MailService mailService, MyMongoRepository myMongoRepository) {
		this.jwtTokenProvider = jwtTokenProvider;
		this.passwordEncoder = passwordEncoder;
		this.mailService = mailService;
		this.myMongoRepository = myMongoRepository;
	}

	public Mono<AuthCheck> authorizeUser(AuthCheck authcheck, Map<String, String> headers) {
		String tokenRoles = WebUtils.getTokenRoles(headers, jwtTokenProvider);
		if (tokenRoles.contains(Role.USERS.name()) && !tokenRoles.contains(Role.GUEST.name())) {
			return Mono.just(new AuthCheck(authcheck.getPath(), true));
		} else {
			return Mono.just(new AuthCheck(authcheck.getPath(), false));
		}
	}

	public Mono<MsgUser> userSignin(MsgUser myUser) {
		try {
			Query query = new Query();
			query.addCriteria(Criteria.where("username").is(myUser.getUsername()));
			MsgUser user = this.myMongoRepository.findOne(query, MsgUser.class).switchIfEmpty(Mono.just(new MsgUser()))
					.block();
			if (user.getUsername() == null) {
				String encryptedPassword = this.passwordEncoder.encode(myUser.getPassword());
				myUser.setPassword(encryptedPassword);
				UUID uuid = UUID.randomUUID();
				myUser.setUuid(uuid.toString());
				this.myMongoRepository.save(myUser).block();
				this.mailService.sendConfirmMail(myUser, this.confirmUrl);
				myUser.setUserId(myUser.getId().toString());
				myUser.setUuid(null);
				return Mono.just(myUser);
			}
		} catch (RuntimeException re) {
			LOG.error("signin failed for: " + myUser.getUsername());
		}
		return Mono.just(new MsgUser());
	}

	public Mono<Boolean> confirmUuid(String uuid) {
		Query query = new Query();
		query.addCriteria(Criteria.where("uuid").is(uuid));
		query.addCriteria(Criteria.where("confirmed").is(false));
		return this.myMongoRepository.findOne(query, MsgUser.class).switchIfEmpty(Mono.just(new MsgUser())).flatMap(user -> {
			if (user.getUuid() != null && user.getUuid().equalsIgnoreCase(uuid)) {
				user.setConfirmed(true);
				return this.myMongoRepository.save(user);
			}
			return Mono.just(user);
		}).map(user -> user.isConfirmed());
	}

	public Mono<MsgUser> userLogin(MsgUser myUser) {
		Query query = new Query();
		query.addCriteria(Criteria.where("username").is(myUser.getUsername()));
		if (this.confirmUrl != null && !this.confirmUrl.isBlank()) {
			query.addCriteria(Criteria.where("confirmed").is(true));
		}
		return this.myMongoRepository.findOne(query, MsgUser.class).switchIfEmpty(Mono.just(new MsgUser())).map(user1 -> {
			if (user1.getId() != null)
				user1.setUserId(user1.getId().toString());
			return user1;
		}).map(user1 -> loginHelp(user1, myUser.getPassword())).onErrorResume(re -> {
			LOG.info("login failed for: " + myUser.getUsername(), re);
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
