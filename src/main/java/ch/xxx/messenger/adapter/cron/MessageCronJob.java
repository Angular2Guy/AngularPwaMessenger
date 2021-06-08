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

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import ch.xxx.messenger.domain.model.Message;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;

@Component
public class MessageCronJob {
	private static final Logger LOG = LoggerFactory.getLogger(MessageCronJob.class);
	@Value("${cronjob.message.ttl.days}")
	private int messageTtl;
	@Autowired
	private ReactiveMongoOperations operations;
	
	/**
	 * remove messages that are older than 30 days. (unreceived/unrequested) 
	 */
	@Scheduled(cron = "5 0 * * * ?")
	@SchedulerLock(name = "MessageCleanUp_scheduledTask", lockAtLeastFor = "PT2H", lockAtMostFor = "PT3H")
	public void cleanUpOldMessages() {
		LOG.info("CleanUpOldMessages started.");
		Date removeTimestamp = Date.from(LocalDateTime.now().minusDays(messageTtl)
				.toInstant(ZoneOffset.systemDefault().getRules().getOffset(Instant.now())));
		this.operations.findAllAndRemove(new Query().addCriteria(Criteria.where("timestamp").lt(removeTimestamp)),
				Message.class).collectList().block();
		LOG.info("CleanUpOldMessages finished.");
	}
}
