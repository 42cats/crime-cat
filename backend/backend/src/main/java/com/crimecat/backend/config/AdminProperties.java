package com.crimecat.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "spring.admin")
@Getter
@Setter
public class AdminProperties {
  private String username;
  private String password;
  private String owner;
}
