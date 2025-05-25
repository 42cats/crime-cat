package com.crimecat.backend.utils;

import jakarta.annotation.PostConstruct;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class ProfileChecker {

  private final Environment env;

  public ProfileChecker(Environment env) {
    this.env = env;
  }


  @PostConstruct
  public Boolean check() {
    String[] activeProfiles = env.getActiveProfiles();
    return Arrays.asList(activeProfiles).contains("prod");
  }
}
