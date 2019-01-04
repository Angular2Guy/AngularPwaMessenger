package ch.xxx.messenger.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import ch.xxx.messenger.jwt.JwtTokenFilterConfigurer;
import ch.xxx.messenger.jwt.JwtTokenProvider;

@Configuration
@Order(SecurityProperties.DEFAULT_FILTER_ORDER)
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {	

	@Autowired
	private JwtTokenProvider jwtTokenProvider;
	
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http.httpBasic();
		http.sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS);
		http.antMatcher("/rest/**").authorizeRequests().anyRequest().authenticated();
		http.antMatcher("/rest/auth").authorizeRequests().anyRequest().permitAll().anyRequest().anonymous();
		http.csrf().disable();
		http.apply(new JwtTokenFilterConfigurer(jwtTokenProvider));
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
	    return new BCryptPasswordEncoder();
	}
}
