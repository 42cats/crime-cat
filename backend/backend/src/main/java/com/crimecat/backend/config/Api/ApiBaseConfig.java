package com.crimecat.backend.config.Api;

import org.springframework.web.reactive.function.client.WebClient;

public interface ApiBaseConfig {
  WebClient getWebClient();
  String getBaseUrl();
}
