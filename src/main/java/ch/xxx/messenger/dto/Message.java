package ch.xxx.messenger.dto;

import java.util.Date;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonProperty;

@Document
public class Message {
	@Id
	private ObjectId _id;
	@Indexed
	@JsonProperty
	private String fromId;
	@Indexed
	@JsonProperty
	private String toId;
	@JsonProperty
	private Long id;
	@JsonProperty
	private Date timestamp;
	@JsonProperty
	private String text;
	@JsonProperty
	private boolean send;
	@JsonProperty
	private boolean received;
	
	public ObjectId get_id() {
		return _id;
	}
	public void set_id(ObjectId _id) {
		this._id = _id;
	}
	public String getFromId() {
		return fromId;
	}
	public void setFromId(String fromId) {
		this.fromId = fromId;
	}
	public String getToId() {
		return toId;
	}
	public void setToId(String toId) {
		this.toId = toId;
	}
	public Date getTimestamp() {
		return timestamp;
	}
	public void setTimestamp(Date timestamp) {
		this.timestamp = timestamp;
	}
	public String getText() {
		return text;
	}
	public void setText(String text) {
		this.text = text;
	}
	public boolean isSend() {
		return send;
	}
	public void setSend(boolean send) {
		this.send = send;
	}
	public boolean isReceived() {
		return received;
	}
	public void setReceived(boolean received) {
		this.received = received;
	}
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	
}
