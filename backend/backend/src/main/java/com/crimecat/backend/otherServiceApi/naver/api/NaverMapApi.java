package com.crimecat.backend.otherServiceApi.naver.api;

import com.crimecat.backend.config.Api.AbstractApiService;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class NaverMapApi extends AbstractApiService {

  private final String CLIENT_ID;
  private final String SECRET_KEY;

  private static final String BASE_URL = "https://openapi.naver.com/v1/";

  public NaverMapApi(
      @Value("${spring.api.naver.map.client-key}") String clientId,
      @Value("${spring.api.naver.map.secret-key}") String secretKey
  ) {
    super(BASE_URL,
        WebClient.builder()
            .defaultHeader("X-Naver-Client-Id", clientId)
            .defaultHeader("X-Naver-Client-Secret", secretKey)
    );
    this.CLIENT_ID = clientId;
    this.SECRET_KEY = secretKey;
  }
  public Mono<Map> searchLocal(String query, int display) {
    return getWithParams(
        "/search/local.json",
        Map.of(
            "query", query,
            "display", String.valueOf(display)
        ),
        Map.class //json 그대로 반환
    );
  }

}
