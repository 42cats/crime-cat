package com.crimecat.backend.config;


public class CacheType {
  public static final String PERSONAL_DASHBOARD_INFO = "personal_dashboard_info";
  public static final String VIEW_COUNT = "VIEW_COUNT";
  public static final String ESCAPE_ROOM_THEME_STATS = "escape_room_theme_stats";
  
  // 게임 기록 관련 캐시 타입 추가
  public static final String INTEGRATED_HISTORIES = "integratedHistories";
  public static final String USER_STATISTICS = "userStatistics";
  public static final String THEME_PLAY_COUNTS = "themePlayCounts";
  public static final String UNPLAYED_THEMES = "unplayedThemes";
  
  public static final String [] CACHE_TYPE = {
      PERSONAL_DASHBOARD_INFO,
      VIEW_COUNT,
      ESCAPE_ROOM_THEME_STATS,
      INTEGRATED_HISTORIES,
      USER_STATISTICS,
      THEME_PLAY_COUNTS,
      UNPLAYED_THEMES
  };
}
