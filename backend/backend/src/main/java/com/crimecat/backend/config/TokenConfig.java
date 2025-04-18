package com.crimecat.backend.config;

import com.crimecat.backend.auth.service.DiscordTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class TokenConfig {

    @Bean
    public WebClient discordWebClient() {
        return WebClient.create("https://discord.com/api");
    }

    @Bean
    public DiscordTokenService discordTokenService(
            WebClient discordWebClient,
            @Value("${spring.security.oauth2.client.registration.discord.client-id}") String clientId,
            @Value("${spring.security.oauth2.client.registration.discord.client-secret}") String clientSecret
    ) {
        return new DiscordTokenService(discordWebClient, clientId, clientSecret);
    }
}
