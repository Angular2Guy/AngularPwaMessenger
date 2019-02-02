package ch.xxx.messenger.utils;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.Map;
import java.util.Optional;

import javax.servlet.http.HttpServletRequest;

import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;

import ch.xxx.messenger.jwt.JwtTokenProvider;
import ch.xxx.messenger.jwt.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;

public class WebUtils {

	public static final String AUTHORIZATION = "authorization";
	public static final String TOKENAUTHKEY = "auth";
	public static final String TOKENLASTMSGKEY = "lastmsg";
	public static final String BEARER = "Bearer ";

	public static boolean checkOBRequest(HttpServletRequest request, String sessionKey) {
		Instant last = (Instant) request.getSession().getAttribute(sessionKey);
		Duration dur = Duration.ofSeconds(10);
		Instant next = last == null ? Instant.now() : last.plus(dur);
		Instant now = Instant.now();
		if (last == null || now.isAfter(next)) {
			request.getSession().setAttribute(sessionKey, now);
			return true;
		}
		return false;
	}

	public static WebClient buildWebClient(String url) {
		ReactorClientHttpConnector connector = new ReactorClientHttpConnector();
		return WebClient.builder().clientConnector(connector).baseUrl(url).build();
	}

	public static Optional<String> extractToken(Map<String, String> headers) {
		String authStr = headers.get(AUTHORIZATION);
		return extractToken(Optional.ofNullable(authStr));
	}

	private static Optional<String> extractToken(Optional<String> authStr) {
		if (authStr.isPresent()) {
			authStr = Optional.ofNullable(authStr.get().startsWith(BEARER) ? authStr.get().substring(7) : null);
		}
		return authStr;
	}

	public static String getTokenRoles(Map<String, String> headers, JwtTokenProvider jwtTokenProvider) {
		Optional<String> tokenStr = extractToken(headers);
		Optional<Jws<Claims>> claims = jwtTokenProvider.getClaims(tokenStr);
		if (claims.isPresent() && new Date().before(claims.get().getBody().getExpiration())) {
			return claims.get().getBody().get(TOKENAUTHKEY).toString();
		}
		return "";
	}

	public static Tuple<String, String> getTokenUserRoles(Map<String, String> headers,
			JwtTokenProvider jwtTokenProvider) {
		Optional<String> tokenStr = extractToken(headers);
		Optional<Jws<Claims>> claims = jwtTokenProvider.getClaims(tokenStr);
		if (claims.isPresent() && new Date().before(claims.get().getBody().getExpiration())) {
			return new Tuple<String, String>(claims.get().getBody().getSubject(),
					claims.get().getBody().get(TOKENAUTHKEY).toString());
		}
		return new Tuple<String, String>(null, null);
	}

	public static boolean checkToken(HttpServletRequest request, JwtTokenProvider jwtTokenProvider) {
		Optional<String> tokenStr = WebUtils
				.extractToken(Optional.ofNullable(request.getHeader(WebUtils.AUTHORIZATION)));
		Optional<Jws<Claims>> claims = jwtTokenProvider.getClaims(tokenStr);
		if (claims.isPresent() && new Date().before(claims.get().getBody().getExpiration())
				&& claims.get().getBody().get(TOKENAUTHKEY).toString().contains(Role.USERS.name())
				&& !claims.get().getBody().get(TOKENAUTHKEY).toString().contains(Role.GUEST.name())) {
			return true;
		}
		return false;
	}
}