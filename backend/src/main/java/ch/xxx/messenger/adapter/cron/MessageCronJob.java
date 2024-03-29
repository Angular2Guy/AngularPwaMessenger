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
package ch.xxx.messenger.adapter.cron;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import ch.xxx.messenger.usecase.service.BingoService;
import ch.xxx.messenger.usecase.service.MessageService;
import jakarta.annotation.PostConstruct;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;

@Component
public class MessageCronJob {
	private static final Logger LOG = LoggerFactory.getLogger(MessageCronJob.class);
	@Value("${cronjob.message.ttl.days}")
	private Long messageTtl;
	private final MessageService messageService;
	private final BingoService bingoService;
	
	public MessageCronJob(MessageService messageService, BingoService bingoService) {
		this.messageService = messageService;
		this.bingoService = bingoService;
	}
	
	@PostConstruct
	public void init() {
		LOG.info("Message ttl: {}", this.messageTtl);
	}
	
	/**
	 * remove messages that are older than 30 days. (unreceived/unrequested) 
	 */
	@Scheduled(cron = "5 0 1 * * ?")
	@SchedulerLock(name = "MessageCleanUp_scheduledTask", lockAtLeastFor = "PT2H", lockAtMostFor = "PT3H")
	public void cleanUpOldMessages() {
		this.messageService.cleanUpMessages(this.messageTtl);
	}
	
	/**
	 * remove last updated more than a day ago. 
	 */
	@Scheduled(cron = "0 5 2 * * ?")
	@SchedulerLock(name = "BingoCleanUp_scheduledTask", lockAtLeastFor = "PT2H", lockAtMostFor = "PT3H")
	public void cleanUpOldBingoGames() {
		this.bingoService.cleanUpGames();
	}
}
