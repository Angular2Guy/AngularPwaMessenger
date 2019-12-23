package ch.xxx.messenger.exception;

public class JwtTokenValidationException extends RuntimeException {

	private static final long serialVersionUID = 4495144584990207860L;

	public JwtTokenValidationException(String message) {
		super(message);
	}
	
	public JwtTokenValidationException(String message, Throwable throwable) {
		super(message,throwable);
	}
}
