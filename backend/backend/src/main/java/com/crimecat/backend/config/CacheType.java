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
  
  // 위치 매핑 관련 캐시 타입
  public static final String LOCATION_MAPPING = "locationMapping";
  public static final String LOCATION_SEARCH = "locationSearch";
  public static final String LOCATION_ALL_MAPPINGS = "locationAllMappings";
  
  // 사용자 관련 캐시 타입
  public static final String USER_DISCORD = "user:discord";
  public static final String USER_PERMISSIONS = "user:permissions";
  public static final String USER_RANKING = "user:ranking";
  
  // 알림 관련 캐시 타입
  public static final String NOTIFICATION_UNREAD = "notification:unread";
  
  // 게임 테마 관련 캐시 타입
  public static final String GAME_THEME = "game:theme";
  public static final String GAME_THEME_LIST = "game:theme:list";
  public static final String GAME_THEME_LIKE = "game:theme:like";
  
  // 게시판 관련 캐시 타입
  public static final String BOARD_POST_LIST = "board:post:list";
  
  // 댓글 관련 캐시 타입
  public static final String COMMENT_LIST = "comment:list";
  public static final String COMMENT_PUBLIC = "comment:public";
  
  // 프로필 관련 캐시 타입
  public static final String USER_PROFILE = "user:profile";
  public static final String USER_PROFILE_STATS = "user:profile:stats";
  
  // 권한 관련 캐시 타입
  public static final String PERMISSION_ALL = "permission:all";
  public static final String PERMISSION_BY_NAME = "permission:name";
  
  // 검색 관련 캐시 타입
  public static final String SEARCH_USERS = "search:users";
  
  public static final String [] CACHE_TYPE = {
      PERSONAL_DASHBOARD_INFO,
      VIEW_COUNT,
      ESCAPE_ROOM_THEME_STATS,
      INTEGRATED_HISTORIES,
      USER_STATISTICS,
      THEME_PLAY_COUNTS,
      UNPLAYED_THEMES,
      LOCATION_MAPPING,
      LOCATION_SEARCH,
      LOCATION_ALL_MAPPINGS,
      USER_DISCORD,
      USER_PERMISSIONS,
      USER_RANKING,
      NOTIFICATION_UNREAD,
      GAME_THEME,
      GAME_THEME_LIST,
      GAME_THEME_LIKE,
      BOARD_POST_LIST,
      COMMENT_LIST,
      COMMENT_PUBLIC,
      USER_PROFILE,
      USER_PROFILE_STATS,
      PERMISSION_ALL,
      PERMISSION_BY_NAME,
      SEARCH_USERS
  };
}
