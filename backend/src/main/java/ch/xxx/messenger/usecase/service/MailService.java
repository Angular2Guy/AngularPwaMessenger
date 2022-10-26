
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

import javax.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import ch.xxx.messenger.domain.model.MsgUser;

@Service
public class MailService {
	private static final Logger LOG = LoggerFactory.getLogger(MailService.class);
	
	private final JavaMailSender javaMailSender;
	
	@Value("${spring.mail.username}")
	private String mailuser;
	@Value("${spring.mail.password}")
	private String mailpwd;
	
	public MailService(JavaMailSender javaMailSender) {
		this.javaMailSender = javaMailSender;
	}
	
	public void sendConfirmMail(@Valid MsgUser myUser, String confirmUrl) {
		if (confirmUrl != null && !confirmUrl.isBlank()) {
			SimpleMailMessage msg = new SimpleMailMessage();
			msg.setTo(myUser.getEmail());
			msg.setSubject("AngularPwaMessenger Account Confirmation Mail");
			String url = confirmUrl + "/" + myUser.getUuid();
			msg.setText(String.format(
					"Welcome to the AngularPwaMessenger please use this link(%s) to confirm your account.", url));
			this.javaMailSender.send(msg);
			LOG.info("Confirm Mail send to: "+myUser.getEmail());
		}
	}
}
