package ch.xxx.messenger.controller;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.xxx.messenger.dto.AuthCheck;
import ch.xxx.messenger.dto.MyUser;
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
	
	@GetMapping("/authorize")
	public Mono<AuthCheck> postAuthorize(@RequestBody AuthCheck authcheck, @RequestHeader Map<String,String> header) {						
		String tokenRoles = WebUtils.getTokenRoles(header, jwtTokenProvider);
		if(tokenRoles.contains(Role.USERS.name()) && !tokenRoles.contains(Role.GUEST.name())) {
			return Mono.just(new AuthCheck(authcheck.getPath(), true));
		} else {
			return Mono.just(new AuthCheck(authcheck.getPath(), false));
		}		
	}	

	@PostMapping("/signin")
	public Mono<MyUser> postUserSignin(@RequestBody MyUser myUser) {
		Query query = new Query();
		query.addCriteria(Criteria.where("username").is(myUser.getUsername()));
		MyUser user = this.operations.findOne(query, MyUser.class).switchIfEmpty(Mono.just(new MyUser())).block();
		if (user.getUsername() == null) {			
			String encryptedPassword = this.passwordEncoder.encode(user.getPassword());
			myUser.setPassword(encryptedPassword);
			this.operations.save(myUser).block();
			return Mono.just(myUser);
		}
		return Mono.just(new MyUser());
	}	

	@PostMapping("/login")
	public Mono<MyUser> postUserLogin(@RequestBody MyUser myUser) {		
		Query query = new Query();
		query.addCriteria(Criteria.where("username").is(myUser.getUsername()));
		return this.operations.findOne(query, MyUser.class).switchIfEmpty(Mono.just(new MyUser()))
				.map(user1 -> loginHelp(user1, myUser.getPassword()));
	}

	private MyUser loginHelp(MyUser user, String passwd) {
		if (user.getUsername() != null) {
			String encryptedPassword = this.passwordEncoder.encode(user.getPassword());
			if (user.getPassword().equals(encryptedPassword)) {				
				String jwtToken = this.jwtTokenProvider.createToken(user.getUsername(), Arrays.asList(Role.USERS), Optional.empty());
				user.setToken(jwtToken);
				user.setPassword("XXX");
				return user;
			}
		}
		return new MyUser();
}
}
