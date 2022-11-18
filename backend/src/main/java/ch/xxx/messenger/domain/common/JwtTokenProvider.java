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
package ch.xxx.messenger.domain.common;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collection;
import java.util.Date;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import javax.crypto.SecretKey;
import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import ch.xxx.messenger.domain.exception.JwtTokenValidationException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtTokenProvider {
	private final static Logger LOGGER = LoggerFactory.getLogger(JwtTokenProvider.class);

	@Value("${security.jwt.token.secret-key}")
	private String secretKey;

	@Value("${security.jwt.token.expire-length}")
	private long validityInMilliseconds; // 24h

	public String createToken(String username, List<Role> roles, Optional<Date> issuedAtOpt) {
		Claims claims = Jwts.claims().setSubject(username);
		claims.put(WebUtils.TOKENAUTHKEY, roles.stream().map(s -> new SimpleGrantedAuthority(s.getAuthority()))
				.filter(Objects::nonNull).collect(Collectors.toList()));
		claims.put(WebUtils.TOKENLASTMSGKEY, new Date().getTime());
		Date issuedAt = issuedAtOpt.orElse(new Date());
		Date validity = new Date(issuedAt.getTime() + validityInMilliseconds);

		SecretKey key = this.createHmacShaSecretKey();
		return Jwts.builder().setClaims(claims).setIssuedAt(issuedAt).setExpiration(validity)
				.signWith(key, SignatureAlgorithm.HS256).compact();
	}

	public Optional<Jws<Claims>> getClaims(Optional<String> token) {
		if (!token.isPresent()) {
			return Optional.empty();
		}
		SecretKey key = this.createHmacShaSecretKey();
		return Optional.of(Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token.get()));
	}

	public Authentication getAuthentication(String token) {
		if (this.getAuthorities(token).stream().filter(role -> role.equals(Role.GUEST)).count() > 0) {
			return new UsernamePasswordAuthenticationToken(this.getUsername(token), null);
		}
		return new UsernamePasswordAuthenticationToken(this.getUsername(token), "", this.getAuthorities(token));
	}

	public String getUsername(String token) {
		SecretKey key = this.createHmacShaSecretKey();
		return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody().getSubject();
	}

	public long getTtl(String token) {
		try {
			SecretKey key = this.createHmacShaSecretKey();
			Date expiration = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody()
					.getExpiration();
			return expiration.getTime() - System.currentTimeMillis();
		} catch (JwtException | IllegalArgumentException e) {
			return -1;
		}
	}

	@SuppressWarnings("unchecked")
	public Collection<Role> getAuthorities(String token) {
		Collection<Role> roles = new LinkedList<>();
		for (Role role : Role.values()) {
			roles.add(role);
		}
		SecretKey key = this.createHmacShaSecretKey();
		List<Map<String, String>> myRoles = (List<Map<String, String>>) Jwts.parserBuilder().setSigningKey(key).build()
				.parseClaimsJws(token).getBody().get("auth");
		return myRoles.stream().map(map -> map.values()).flatMap(Collection::stream)
				.map(str -> roles.stream().filter(r -> r.name().equals(str)).findFirst().orElse(Role.GUEST))
				.collect(Collectors.toList());
	}

	public String resolveToken(HttpServletRequest req) {
		String bearerToken = req.getHeader(WebUtils.AUTHORIZATION);
		if (bearerToken != null && bearerToken.startsWith(WebUtils.BEARER)) {
			return bearerToken.substring(7, bearerToken.length());
		}
		return null;
	}

	public boolean validateToken(String token) {
		SecretKey key = this.createHmacShaSecretKey();
		try {
			Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
			return true;
		} catch (JwtException | IllegalArgumentException e) {
			throw new JwtTokenValidationException("Expired or invalid JWT token", e);
		}
	}

	private SecretKey createHmacShaSecretKey() {
		return Keys.hmacShaKeyFor(Base64.getUrlDecoder().decode(secretKey.getBytes(StandardCharsets.ISO_8859_1)));		
	}
}