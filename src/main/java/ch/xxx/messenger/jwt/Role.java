package ch.xxx.messenger.jwt;

import org.springframework.security.core.GrantedAuthority;

public enum Role implements GrantedAuthority{
	USERS, GUEST;

	@Override
	public String getAuthority() {		
		return this.name();
	}
	
}