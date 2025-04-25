package com.crimecat.backend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

  @Bean
  public CacheManager cacheManager() {
    // Caffeine 설정 빌더
    Caffeine<Object, Object> caffeine = Caffeine.newBuilder()
        .expireAfterWrite(10, TimeUnit.MINUTES) // 10분간 캐시 유지
        .maximumSize(1000);                     // 최대 항목 수 제한

    List<String> cacheNames = Arrays.asList(CacheType.CACHE_TYPE);

    // CaffeineCacheManager 생성
    CaffeineCacheManager cacheManager = new CaffeineCacheManager();
    cacheManager.setCaffeine(caffeine);
    cacheManager.setCacheNames(cacheNames);
    return cacheManager;
  }
}
