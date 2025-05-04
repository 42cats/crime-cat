package com.crimecat.backend.config;


import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRepository;

@Configuration
@RequiredArgsConstructor
public class CsrfTokenConfig {

  private final ServiceUrlConfig serviceUrlConfig;

  @Bean
  public CsrfTokenRepository csrfTokenRepository(){
    CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
    repository.setCookieName("XSRF-TOKEN");
    repository.setHeaderName("X-XSRF-TOKEN");
    repository.setCookiePath("/");

    repository.setCookieCustomizer(
        responseCookieBuilder ->
            responseCookieBuilder
                .maxAge(Duration.ofHours(1))
                .sameSite("Strict")
                .domain(serviceUrlConfig.getDomain())
                .secure(true)
    );
    return repository;
  }
}
