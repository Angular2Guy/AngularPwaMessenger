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
package ch.xxx.messenger.adapter.config;

import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter.HeaderValue;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import ch.xxx.messenger.domain.common.JwtTokenProvider;
import ch.xxx.messenger.domain.common.Role;

@Configuration
@Order(SecurityProperties.DEFAULT_FILTER_ORDER)
public class WebSecurityConfig {

	private final JwtTokenProvider jwtTokenProvider;

	public WebSecurityConfig(JwtTokenProvider jwtTokenProvider) {
		this.jwtTokenProvider = jwtTokenProvider;
	}

	@Bean
	public SecurityFilterChain configure(HttpSecurity http) throws Exception {
		JwtTokenFilter customFilter = new JwtTokenFilter(jwtTokenProvider);
		HttpSecurity httpSecurity = http
				.authorizeHttpRequests(authorize -> authorize
						.requestMatchers(AntPathRequestMatcher.antMatcher("/rest/auth/**")).permitAll()
						.requestMatchers(AntPathRequestMatcher.antMatcher("/rest/**")).hasAuthority(Role.USERS.toString())
						.requestMatchers(AntPathRequestMatcher.antMatcher("/**")).permitAll())
				.csrf(myCsrf -> myCsrf.disable())
				.sessionManagement(mySm -> mySm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.headers(myHeaders -> myHeaders.contentSecurityPolicy(myCsp -> myCsp.policyDirectives(
						"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';")))
				.headers(myHeaders -> myHeaders.xssProtection(myXss -> myXss.headerValue(HeaderValue.ENABLED)))
				.headers(myHeaders -> myHeaders.frameOptions(myFo -> myFo.sameOrigin()))
				.addFilterBefore(customFilter, UsernamePasswordAuthenticationFilter.class);				
		return httpSecurity.build();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
