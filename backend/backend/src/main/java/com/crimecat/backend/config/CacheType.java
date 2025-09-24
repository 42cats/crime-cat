package com.crimecat.backend.config;


public class CacheType {
  public static final String PERSONAL_DASHBOARD_INFO = "personal_dashboard_info";
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
  public static final String GAME_THEME_ENTITY = "game:theme:entity";
  public static final String GAME_THEME_RESPONSE = "game:theme:response";
  public static final String GAME_THEME_LIST = "game:theme:list";
  public static final String GAME_THEME_LIST_BY_TYPE = "game:theme:list:type";
  public static final String GAME_THEME_LIKE = "game:theme:like";
  public static final String USER_THEME_SUMMARY = "user:theme:summary";
  
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
  
  // 외부 API 캐시 타입
  public static final String DISCORD_GUILD_INFO = "discord:guild:info";
  public static final String DISCORD_GUILD_CHANNELS = "discord:guild:channels";
  public static final String DISCORD_GUILD_ROLES = "discord:guild:roles";
  public static final String NAVER_LOCAL_SEARCH = "naver:local:search";
  
  // 광고 관련 캐시 타입
  public static final String THEME_AD_ACTIVE = "theme:ad:active";
  public static final String THEME_AD_ACTIVE_CAROUSEL = "theme:ad:active_carousel";
  public static final String THEME_AD_QUEUE = "theme:ad:queue";
  public static final String THEME_AD_USER_REQUESTS = "theme:ad:user:requests";
  public static final String THEME_AD_STATS = "theme:ad:stats";
  public static final String THEME_AD_USER_STATS = "theme:ad:user:stats";
  public static final String THEME_AD_USER_SUMMARY = "theme:ad:user:summary";
  public static final String THEME_AD_PLATFORM_STATS = "theme:ad:platform:stats";
  
  // 사이트맵 관련 캐시 타입
  public static final String SITEMAP_INDEX = "sitemap:index";
  public static final String SITEMAP_THEMES = "sitemap:themes";
  public static final String SITEMAP_POSTS = "sitemap:posts";
  public static final String SITEMAP_PROFILES = "sitemap:profiles";
  public static final String SITEMAP_SNS = "sitemap:sns";
  public static final String SITEMAP_NOTICES = "sitemap:notices";
  public static final String SITEMAP_COMMANDS = "sitemap:commands";
  public static final String SITEMAP_GAME_THEMES = "sitemap:game_themes";
  
  // === Caffeine 캐시는 이제 CaffeineCacheType enum에서 관리 ===

  // === Redis 분산 캐시 전용 타입 (영속성, 분산 동기화) ===

  // 스케줄 관련 캐시는 CaffeineCacheType enum으로 이동됨
  
  public static final String [] CACHE_TYPE = {
      PERSONAL_DASHBOARD_INFO,
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
      GAME_THEME_ENTITY,
      GAME_THEME_RESPONSE,
      GAME_THEME_LIST,
      GAME_THEME_LIST_BY_TYPE,
      GAME_THEME_LIKE,
      USER_THEME_SUMMARY,
      BOARD_POST_LIST,
      COMMENT_LIST,
      COMMENT_PUBLIC,
      USER_PROFILE,
      USER_PROFILE_STATS,
      PERMISSION_ALL,
      PERMISSION_BY_NAME,
      SEARCH_USERS,
      DISCORD_GUILD_INFO,
      DISCORD_GUILD_CHANNELS,
      DISCORD_GUILD_ROLES,
      NAVER_LOCAL_SEARCH,
      THEME_AD_ACTIVE,
      THEME_AD_ACTIVE_CAROUSEL,
      THEME_AD_QUEUE,
      THEME_AD_USER_REQUESTS,
      THEME_AD_STATS,
      THEME_AD_USER_STATS,
      THEME_AD_USER_SUMMARY,
      THEME_AD_PLATFORM_STATS,
      SITEMAP_INDEX,
      SITEMAP_THEMES,
      SITEMAP_POSTS,
      SITEMAP_PROFILES,
      SITEMAP_SNS,
      SITEMAP_NOTICES,
      SITEMAP_COMMANDS,
      SITEMAP_GAME_THEMES
      // === Caffeine 캐시들은 CaffeineCacheType enum에서 관리됨 ===
      // === 스케줄 관련 캐시는 CaffeineCacheType enum으로 이동됨 ===
  };
}
