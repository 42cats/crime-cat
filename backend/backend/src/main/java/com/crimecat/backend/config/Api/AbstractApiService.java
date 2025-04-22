package com.crimecat.backend.config.Api;

import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

public abstract class AbstractApiService implements ApiBaseConfig {

  protected final WebClient webClient;
  private final String baseUrl;

  protected AbstractApiService(String baseUrl, WebClient.Builder builder) {
    this.webClient = builder
        .baseUrl(baseUrl)
        .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
        .build();
    this.baseUrl = baseUrl;
  }

  @Override
  public WebClient getWebClient() {
    return this.webClient;
  }

  @Override
  public String getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * 단순 GET 요청
   */
  protected <T> Mono<T> get(String uri, Class<T> responseType) {
    return webClient.get()
        .uri(uri)
        .retrieve()
        .bodyToMono(responseType);
  }

  /**
   * 쿼리 파라미터 포함 GET 요청
   */
  protected <T> Mono<T> getWithParams(String uri, Map<String, String> queryParams, Class<T> responseType) {
    return webClient.get()
        .uri(builder -> {
          var uriBuilder = builder.path(uri);
          queryParams.forEach(uriBuilder::queryParam);
          return uriBuilder.build();
        })
        .retrieve()
        .bodyToMono(responseType);
  }

  /**
   * POST 요청 (Body 포함)
   */
  protected <T, R> Mono<R> post(String uri, T requestBody, Class<R> responseType) {
    return webClient.post()
        .uri(uri)
        .contentType(MediaType.APPLICATION_JSON)
        .body(BodyInserters.fromValue(requestBody))
        .retrieve()
        .bodyToMono(responseType);
  }

  /**
   * POST 요청 (쿼리 파라미터 + 바디 포함)
   */
  protected <T, R> Mono<R> postWithParams(String uri, Map<String, String> queryParams, T requestBody, Class<R> responseType) {
    return webClient.post()
        .uri(builder -> {
          var uriBuilder = builder.path(uri);
          queryParams.forEach(uriBuilder::queryParam);
          return uriBuilder.build();
        })
        .contentType(MediaType.APPLICATION_JSON)
        .body(BodyInserters.fromValue(requestBody))
        .retrieve()
        .bodyToMono(responseType);
  }
}
