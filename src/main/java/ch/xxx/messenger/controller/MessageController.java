package ch.xxx.messenger.controller;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.xxx.messenger.dto.Message;
import ch.xxx.messenger.dto.SyncMsgs;
import ch.xxx.messenger.jwt.JwtTokenProvider;
import ch.xxx.messenger.jwt.Role;
import ch.xxx.messenger.utils.Tuple;
import ch.xxx.messenger.utils.WebUtils;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/rest/message")
public class MessageController {
	@Autowired
	private ReactiveMongoOperations operations;
	@Autowired
	private JwtTokenProvider jwtTokenProvider;

	@PostMapping("/findMsgs")
	public Flux<Message> getFindMessages(@RequestBody SyncMsgs syncMsgs, @RequestHeader Map<String, String> header) {
		Tuple<String, String> tokenTuple = WebUtils.getTokenUserRoles(header, jwtTokenProvider);
		if (tokenTuple.getB().contains(Role.USERS.name()) && !tokenTuple.getB().contains(Role.GUEST.name())) {
			return operations
					.find(new Query().addCriteria(
							Criteria.where("fromId").in(syncMsgs.getContactIds())
							.orOperator(Criteria.where("toId").is(syncMsgs.getOwnId()))), Message.class);							
		}
		return Flux.empty();
	}

	@PostMapping("/storeMsgs")
	public Flux<Message> putStoreMessages(@RequestBody SyncMsgs syncMsgs, @RequestHeader Map<String, String> header) {
		List<Message> msgs = syncMsgs.getMsgs().stream().map(msg -> {
			msg.setSend(true);
			return msg;
		}).map(msg -> {
			msg.setTimestamp(new Date());
			return msg;
		}).collect(Collectors.toList());
		return this.operations.insertAll(msgs);
	}
}
