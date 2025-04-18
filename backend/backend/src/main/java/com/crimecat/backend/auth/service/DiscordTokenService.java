package com.crimecat.backend.auth.service;

import com.crimecat.backend.auth.dto.DiscordTokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

@RequiredArgsConstructor
public class DiscordTokenService {

    private final WebClient webClient;
    private final String clientId;
    private final String clientSecret;

    public DiscordTokenResponse refreshAccessToken(String refreshToken){
        return webClient.post()
                .uri("/oauth2/token")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body(BodyInserters.fromFormData("client_id", clientId)
                        .with("client_secret", clientSecret)
                        .with("grant_type", "refresh_token")
                        .with("refresh_token", refreshToken))
                .retrieve()
                .bodyToMono(DiscordTokenResponse.class)
                .block();
    }

}
