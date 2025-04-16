package com.crimecat.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class DiscordBotTokenFilter extends OncePerRequestFilter {

	@Value("${spring.security.bot-auth.discord-bot-secret-token}")
	private String DISCORD_BOT_SECRET_TOKEN;

	@Override
	protected void doFilterInternal(HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain)
			throws ServletException, IOException {

		String path = request.getRequestURI();

		if (!path.startsWith("/v1/bot/")) {
			filterChain.doFilter(request, response);
			return;
		}

		String authHeader = request.getHeader("Authorization");
		if (authHeader == null || !authHeader.startsWith("Bearer ")) {
			reject(response, "Missing or invalid Authorization header");
			return;
		}

		String discordBotToken = authHeader.substring(7);
		if (!discordBotToken.equals(DISCORD_BOT_SECRET_TOKEN)) {
			reject(response, "Invalid bot token");
			return;
		}

		filterChain.doFilter(request, response);
	}

	private void reject(HttpServletResponse response, String message) throws IOException {
		response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		response.setContentType("application/json");
		response.getWriter().write("{\"error\": \"" + message + "\"}");
	}
}
