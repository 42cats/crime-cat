package com.crimecat.backend.utils;

import java.time.Duration;

public enum RedisDbType {
  MAKER_COUNT(Duration.ofHours(1)),
  REGISTERED_THEME(Duration.ofHours(1)),
  ALL_USER_COUNT(Duration.ofMinutes(10)),
  ALL_DISCORD_SERVER(Duration.ofHours(2)),
  PLAYED_USER_COUNT(Duration.ofHours(2));

  private final Duration ttl;

  RedisDbType(Duration ttl) {
    this.ttl = ttl;
  }

  public Duration getTtl() {
    return ttl;
  }
}
