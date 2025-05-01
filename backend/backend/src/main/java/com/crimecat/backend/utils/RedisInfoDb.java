package com.crimecat.backend.utils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RedisInfoDb {


  private final RedisTemplate<String, String> redisTemplate;
  private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

  public RedisInfoDb(RedisTemplate<String, String> redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  /**
   * 오늘 자정까지 남은 시간으로 TTL 저장
   */
  public void save(RedisDbType type, String value) {
    String timeStamp = LocalDateTime.now()
        .format(FORMATTER);
    redisTemplate.opsForValue().set(type.toString(), value, type.getTtl());
  }

  public Optional<String> load(RedisDbType type) {
    String string = redisTemplate.opsForValue()
        .get(type.toString());
    return Optional.ofNullable(string);
  }

}
