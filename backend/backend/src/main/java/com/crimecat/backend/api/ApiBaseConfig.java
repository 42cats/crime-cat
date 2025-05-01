package com.crimecat.backend.api;

import org.springframework.web.reactive.function.client.WebClient;

public interface ApiBaseConfig {
  WebClient getWebClient();
  String getBaseUrl();
}
