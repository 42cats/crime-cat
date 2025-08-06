package com.crimecat.backend.storage;

public enum StorageFileType {
  AVATAR("avatar"),
  GAME_THEME("game-theme"),
  USER_POST_IMAGE("user-post"),
  BOARD_POST_AUDIO("board-post-audio");

  private final String key;
  private String uploadDir;
  private String baseUrl;

  StorageFileType(String key) {
    this.key = key;
  }

  /**
   * 애플리케이션 기동 시 ConfigurationProperties 에서 값을 주입할 때 사용합니다.
   */
  void init(String uploadDir, String baseUrl) {
    this.uploadDir = uploadDir;
    this.baseUrl  = baseUrl;
  }

  public String getUploadDir() {
    return uploadDir;
  }

  public String getBaseUrl() {
    return baseUrl;
  }

  /**
   * application.yml 의 하위 키 이름 (avatar, game-theme) 을 돌릴 때 사용합니다.
   */
  public String getKey() {
    return key;
  }
}
