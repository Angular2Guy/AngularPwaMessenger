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
package ch.xxx.messenger.domain.model;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonProperty;

@Document
public class SyncMsgs {
	@NotNull
	@JsonProperty
	private Date lastUpdate;
	@NotBlank
	@JsonProperty
	private String ownId;
	@JsonProperty
	private List<String> contactIds = new ArrayList<>();
	@JsonProperty 
	private List<Message> msgs = new ArrayList<>();

	public String getOwnId() {
		return ownId;
	}

	public void setOwnId(String ownId) {
		this.ownId = ownId;
	}

	public List<Message> getMsgs() {
		return msgs;
	}

	public void setMsgs(List<Message> msgs) {
		this.msgs = msgs;
	}

	public List<String> getContactIds() {
		return contactIds;
	}

	public void setContactIds(List<String> contactIds) {
		this.contactIds = contactIds;
	}

	public Date getLastUpdate() {
		return lastUpdate;
	}

	public void setLastUpdate(Date lastUpdate) {
		this.lastUpdate = lastUpdate;
	}
	
}
