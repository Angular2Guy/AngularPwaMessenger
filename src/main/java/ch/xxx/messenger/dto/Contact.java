package ch.xxx.messenger.dto;

public class Contact {
	private String name;
	private String base64Avatar;	
	private String publicKey;

	public Contact(String name, String base64Avatar, String publicKey) {
		super();
		this.name = name;
		this.base64Avatar = base64Avatar;
		this.publicKey = publicKey;
	}
	public String getName() {
		return name;
	}
	public String getBase64Avatar() {
		return base64Avatar;
	}
	public String getPublicKey() {
		return publicKey;
	}
	  
}
