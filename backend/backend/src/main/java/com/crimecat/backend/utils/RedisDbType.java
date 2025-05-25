package com.crimecat.backend.utils;

import java.time.Duration;

public enum RedisDbType {
  MAKER_COUNT(Duration.ofHours(1)),
  REGISTERED_THEME(Duration.ofHours(1)),
  ALL_USER_COUNT(Duration.ofMinutes(10)),
  ALL_DISCORD_SERVER(Duration.ofHours(2)),
  PLAYED_USER_COUNT(Duration.ofHours(2)),
  
  // 사용자 관련 캐시
  USER_PERMISSIONS(Duration.ofMinutes(15)),
  USER_RANKING(Duration.ofMinutes(5)),
  USER_PROFILE(Duration.ofMinutes(10)),
  USER_PROFILE_STATS(Duration.ofMinutes(5)),
  
  // 게임 테마 관련 캐시
  GAME_THEME_DETAIL(Duration.ofMinutes(30)),
  GAME_THEME_LIST(Duration.ofMinutes(5)),
  GAME_THEME_LIKE_STATUS(Duration.ofMinutes(5)),
  
  // 게시판 관련 캐시
  BOARD_POST_PAGE(Duration.ofMinutes(2)),
  
  // 댓글 관련 캐시
  COMMENT_LIST(Duration.ofMinutes(2)),
  COMMENT_PUBLIC_LIST(Duration.ofMinutes(5)),
  
  // 알림 관련 캐시
  NOTIFICATION_UNREAD_COUNT(Duration.ofSeconds(30)),
  
  // 권한 관련 캐시
  PERMISSION_LIST(Duration.ofHours(1)),
  PERMISSION_BY_NAME(Duration.ofHours(1)),
  
  // 검색 관련 캐시
  SEARCH_RESULT_USERS(Duration.ofMinutes(2)),
  
  // 통계 관련 캐시
  TOTAL_USER_RANKING(Duration.ofMinutes(10));

  private final Duration ttl;

  RedisDbType(Duration ttl) {
    this.ttl = ttl;
  }

  public Duration getTtl() {
    return ttl;
  }
}
