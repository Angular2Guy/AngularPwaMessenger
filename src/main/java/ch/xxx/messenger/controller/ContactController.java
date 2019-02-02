package ch.xxx.messenger.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.xxx.messenger.dto.Contact;
import ch.xxx.messenger.dto.MyUser;
import ch.xxx.messenger.jwt.JwtTokenProvider;
import ch.xxx.messenger.jwt.Role;
import ch.xxx.messenger.utils.Tuple;
import ch.xxx.messenger.utils.WebUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/rest/contact")
public class ContactController {
	@Autowired
	private ReactiveMongoOperations operations;
	@Autowired
	private JwtTokenProvider jwtTokenProvider;

	@PostMapping("/findcontacts")
	public Flux<Contact> getFindContacts(@RequestBody Contact contact,  @RequestHeader Map<String, String> header) {
		Tuple<String, String> tokenTuple = WebUtils.getTokenUserRoles(header, jwtTokenProvider);
		if (tokenTuple.getB().contains(Role.USERS.name()) && !tokenTuple.getB().contains(Role.GUEST.name())) {
			return operations.find(new Query().addCriteria(Criteria.where("username").regex(String.format(".*%s.*", contact.getName()))), MyUser.class)
					.map(myUser -> new Contact(myUser.getUsername(), myUser.getBase64Avatar(), myUser.getBase64PublicKey()));
		}
		return Flux.empty();
	}

	@GetMapping("/mycontacts")
	public Flux<Contact> getContacts(@RequestHeader Map<String, String> header) {
		Tuple<String, String> tokenTuple = WebUtils.getTokenUserRoles(header, jwtTokenProvider);
		if (tokenTuple.getB().contains(Role.USERS.name()) && !tokenTuple.getB().contains(Role.GUEST.name())) {
			return operations
					.findOne(new Query().addCriteria(Criteria.where("username").is(tokenTuple.getA())), MyUser.class)
					.flatMapMany(myUser -> operations
							.find(new Query().addCriteria(Criteria.where("_id").in(myUser.getContacts())), MyUser.class)
							.map(myUser1 -> new Contact(myUser1.getUsername(), myUser1.getBase64Avatar(),
									myUser1.getBase64PublicKey())));

		}
		return Flux.empty();
	}

	@PutMapping("/mycontact")
	public Mono<MyUser> putContact(@RequestBody Contact contact, @RequestHeader Map<String, String> header) {
		Tuple<String, String> tokenTuple = WebUtils.getTokenUserRoles(header, jwtTokenProvider);
		if (tokenTuple.getB().contains(Role.USERS.name()) && !tokenTuple.getB().contains(Role.GUEST.name())) {
			operations.findOne(new Query().addCriteria(Criteria.where("username").is(tokenTuple.getA())), MyUser.class)
					.flatMap(me -> operations
							.findOne(new Query().addCriteria(Criteria.where("username").is(contact.getName())),
									MyUser.class)
							.flatMap(newContact -> {
								if (!me.getContacts().contains(newContact.get_id())) {
									me.getContacts().add(newContact.get_id());
									return operations.save(me);
								}
								return Mono.empty();
							}));
			return Mono.empty();
		}
		return Mono.empty();
	}
}
