package com.crimecat.backend.gametheme.service;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.crimecat.backend.boardPost.repository.BoardPostRepository;
import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.gametheme.repository.GameThemeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ViewCountService {
  private final GameThemeRepository themeRepository;
  private final BoardPostRepository boardPostRepository;

  @Transactional
  @Cacheable(value = CacheType.VIEW_COUNT, key = "#theme.id + ':' + #ip")
  public boolean themeIncrement(GameTheme theme, String ip) {
    log.info("🔍 조회수 증가 처리 - 테마: {}, IP: {}, 현재 조회수: {}", 
        theme.getId(), ip, theme.getViews());
    theme.viewed();
    themeRepository.save(theme);
    log.info("✅ 조회수 증가 완료 - 테마: {}, 새 조회수: {}", 
        theme.getId(), theme.getViews());
    return true;
  }
  @Transactional
  @Cacheable(value = CacheType.VIEW_COUNT, key = "#board.id + ':' + #ip")
  public boolean boardIncrement(BoardPost board, String ip) {
    board.viewed();
    boardPostRepository.save(board);
    return true;
  }
}
