package com.crimecat.backend.utils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class UserDailyCheckUtil {

  private static final String PREFIX = "DailyUserCheck:";

  private final RedisTemplate<String, String> redisTemplate;
  private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

  public UserDailyCheckUtil(RedisTemplate<String, String> redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  /**
   * 오늘 자정까지 남은 시간으로 TTL 저장
   */
  public void save(String userKey) {
    String timeStamp = LocalDateTime.now()
        .format(FORMATTER);
    Duration ttl = getSecondsUntilMidnight();
    redisTemplate.opsForValue().set(PREFIX + userKey, timeStamp, ttl);
  }

  public Optional<LocalDateTime> load(String userKey) {
    String value = redisTemplate.opsForValue().get(PREFIX + userKey);
    return Optional.ofNullable(value).map(v -> LocalDateTime.parse(v, FORMATTER));
  }

  private Duration getSecondsUntilMidnight() {
    var now = java.time.LocalDateTime.now();
    var midnight = now.toLocalDate().plusDays(1).atStartOfDay();
    return Duration.between(now, midnight);
  }
}
