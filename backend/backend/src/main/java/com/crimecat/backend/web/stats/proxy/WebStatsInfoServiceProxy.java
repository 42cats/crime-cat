package com.crimecat.backend.web.stats.proxy;

import com.crimecat.backend.bot.user.domain.User;
import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.web.stats.service.WebStatsInfoService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WebStatsInfoServiceProxy {
  private final WebStatsInfoService service;

  @Cacheable(value = CacheType.PERSONAL_DASHBOARD_INFO, key = "#user")
  public Map<String, String> getUserPersonalGameInfo(User user) {
    return service.getUserPersonalGameInfo(user); // 내부 로직 따로 빼도 됨
  }
}
