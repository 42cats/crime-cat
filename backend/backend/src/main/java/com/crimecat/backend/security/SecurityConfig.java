package com.crimecat.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@EnableWebSecurity
@Configuration
public class SecurityConfig {

	private final DiscordBotTokenFilter discordBotTokenFilter;

	public SecurityConfig(DiscordBotTokenFilter discordBotTokenFilter) {
		this.discordBotTokenFilter = discordBotTokenFilter;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				.csrf(AbstractHttpConfigurer::disable)
				.sessionManagement(session -> session
						.sessionCreationPolicy(SessionCreationPolicy.STATELESS) // 세션 사용 안 함
				)
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/v1/bot/**").permitAll() // 봇 요청은 필터에서만 검증
						.anyRequest().authenticated() // 나머지 요청은 인증 필요 (예: 사용자)
				)
				.addFilterBefore(discordBotTokenFilter, UsernamePasswordAuthenticationFilter.class); // 봇 필터 먼저 실행

		return http.build();
	}
}
