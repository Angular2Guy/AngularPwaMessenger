package ch.xxx.messenger.dto;

import java.util.Arrays;
import java.util.Collection;
import java.util.Date;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.fasterxml.jackson.annotation.JsonProperty;

public class MyUser implements UserDetails {

	private static final long serialVersionUID = 3477333851877579761L;

	@Id
	private ObjectId _id;
	@JsonProperty
	private Date createdAt = new Date();	
	@JsonProperty
	private String username;
	@JsonProperty
	private String password;
	@JsonProperty
	private String email;	
	@JsonProperty
	private String token;
	
	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		GrantedAuthority auth = () -> "USERS"; 					
		return Arrays.asList(auth);
	}

	@Override
	public String getPassword() {
		return this.password;
	}

	public void setPassword(String password) {
		this.password = password;
	}
	
	@Override
	public String getUsername() {
		return this.username;
	}	

	public void setUsername(String username) {
		this.username = username;
	}
	
	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return true;
	}

	public ObjectId get_id() {
		return _id;
	}

	public void set_id(ObjectId _id) {
		this._id = _id;
	}

	public Date getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Date createdAt) {
		this.createdAt = createdAt;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getToken() {
		return token;
	}

	public void setToken(String token) {
		this.token = token;
	}

}
