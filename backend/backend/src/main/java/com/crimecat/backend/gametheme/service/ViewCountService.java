package com.crimecat.backend.gametheme.service;

import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.gametheme.repository.GameThemeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ViewCountService {
  private final GameThemeRepository themeRepository;

  @Cacheable(value = CacheType.VIEW_COUNT, key = "#theme.id + ':' + #ip")
  public boolean increment(GameTheme theme, String ip) {
    theme.viewed();
    themeRepository.save(theme);
    return true;
  }
}
