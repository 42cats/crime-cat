package com.crimecat.backend.gametheme.service;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.crimecat.backend.boardPost.repository.BoardPostRepository;
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
  private final BoardPostRepository boardPostRepository;

  @Cacheable(value = CacheType.VIEW_COUNT, key = "#theme.id + ':' + #ip")
  public boolean themeIncrement(GameTheme theme, String ip) {
    theme.viewed();
    themeRepository.save(theme);
    return true;
  }
  @Cacheable(value = CacheType.VIEW_COUNT, key = "#board.id + ':' + #ip")
  public boolean boardIncrement(BoardPost board, String ip) {
    board.viewed();
    boardPostRepository.save(board);
    return true;
  }
}
