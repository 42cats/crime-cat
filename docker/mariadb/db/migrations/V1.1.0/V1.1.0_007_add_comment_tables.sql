USE ${DB_DISCORD};

-- 참조하는 테이블이 존재하는지 확인
SET @game_themes_exists = (SELECT COUNT(*) FROM information_schema.tables 
                         WHERE table_schema = '${DB_DISCORD}' AND table_name = 'GAME_THEMES');

SET @web_users_exists = (SELECT COUNT(*) FROM information_schema.tables 
                       WHERE table_schema = '${DB_DISCORD}' AND table_name = 'WEB_USERS');

SET @comments_exists = (SELECT COUNT(*) FROM information_schema.tables 
                      WHERE table_schema = '${DB_DISCORD}' AND table_name = 'COMMENTS');

-- 참조하는 테이블이 존재하는 경우에만 COMMENTS 테이블 생성
IF @game_themes_exists > 0 AND @web_users_exists > 0 AND @comments_exists = 0 THEN
  CREATE TABLE COMMENTS (
  ID                 BINARY(16) PRIMARY KEY,
  CONTENT            TEXT NOT NULL,
  GAME_THEME_ID      BINARY(16) NOT NULL,
  AUTHOR_ID          BINARY(16) NOT NULL,
  PARENT_ID          BINARY(16) NULL,
  IS_SPOILER         BOOLEAN    NOT NULL DEFAULT FALSE,
  LIKES              INT        NOT NULL DEFAULT 0,
  IS_DELETED         BOOLEAN    NOT NULL DEFAULT FALSE,
  CREATED_AT         DATETIME   NOT NULL
                         DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT         DATETIME   NULL
                         DEFAULT NULL
                         ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT FK_COMMENT_THEME
    FOREIGN KEY (GAME_THEME_ID)
    REFERENCES GAME_THEMES(ID)
    ON DELETE RESTRICT,
  CONSTRAINT FK_COMMENT_AUTHOR
    FOREIGN KEY (AUTHOR_ID)
    REFERENCES WEB_USERS(ID)
    ON DELETE RESTRICT,
  CONSTRAINT FK_COMMENT_PARENT
    FOREIGN KEY (PARENT_ID)
    REFERENCES COMMENTS(ID)
    ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
END IF;

-- 테이블이 존재하는지 처음부터 다시 확인
SET @comments_exists_now = (SELECT COUNT(*) FROM information_schema.tables 
                           WHERE table_schema = '${DB_DISCORD}' AND table_name = 'COMMENTS');

SET @comment_likes_exists = (SELECT COUNT(*) FROM information_schema.tables 
                            WHERE table_schema = '${DB_DISCORD}' AND table_name = 'COMMENT_LIKES');

-- COMMENTS 테이블이 존재하고 COMMENT_LIKES 테이블이 없는 경우에만 COMMENT_LIKES 테이블 생성
IF @comments_exists_now > 0 AND @comment_likes_exists = 0 THEN
  ID           BINARY(16) PRIMARY KEY,
  USER_ID      BINARY(16) NOT NULL,
  COMMENT_ID   BINARY(16) NOT NULL,
  CREATED_AT   DATETIME   NOT NULL
                DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT FK_LIKE_USER
    FOREIGN KEY (USER_ID)
    REFERENCES WEB_USERS(ID)
    ON DELETE RESTRICT,
  CONSTRAINT FK_LIKE_COMMENT
    FOREIGN KEY (COMMENT_ID)
    REFERENCES COMMENTS(ID)
    ON DELETE CASCADE,
  UNIQUE KEY UK_COMMENT_LIKES_USER_COMMENT (USER_ID, COMMENT_ID)
END IF;

-- COMMENTS 테이블이 존재할 경우에만 인덱스 작업 실행
SET @comments_exists_final = (SELECT COUNT(*) FROM information_schema.tables 
                             WHERE table_schema = '${DB_DISCORD}' AND table_name = 'COMMENTS');

IF @comments_exists_final > 0 THEN
  -- 인덱스 존재 여부 확인
  SET @idx_game_theme_exists = (SELECT COUNT(*) FROM information_schema.statistics
                              WHERE table_schema = '${DB_DISCORD}'
                              AND table_name = 'COMMENTS'
                              AND index_name = 'IDX_COMMENT_GAME_THEME_ID');

  SET @idx_author_exists = (SELECT COUNT(*) FROM information_schema.statistics
                           WHERE table_schema = '${DB_DISCORD}'
                           AND table_name = 'COMMENTS'
                           AND index_name = 'IDX_COMMENT_AUTHOR_ID');

  SET @idx_parent_exists = (SELECT COUNT(*) FROM information_schema.statistics
                           WHERE table_schema = '${DB_DISCORD}'
                           AND table_name = 'COMMENTS'
                           AND index_name = 'IDX_COMMENT_PARENT_ID');

  SET @idx_theme_created_exists = (SELECT COUNT(*) FROM information_schema.statistics
                                  WHERE table_schema = '${DB_DISCORD}'
                                  AND table_name = 'COMMENTS'
                                  AND index_name = 'IDX_COMMENT_THEME_CREATED_AT');

  -- 필요한 인덱스만 생성
  IF @idx_game_theme_exists = 0 THEN
    CREATE INDEX IDX_COMMENT_GAME_THEME_ID ON COMMENTS(GAME_THEME_ID);
  END IF;

  IF @idx_author_exists = 0 THEN
    CREATE INDEX IDX_COMMENT_AUTHOR_ID ON COMMENTS(AUTHOR_ID);
  END IF;

  IF @idx_parent_exists = 0 THEN
    CREATE INDEX IDX_COMMENT_PARENT_ID ON COMMENTS(PARENT_ID);
  END IF;

  IF @idx_theme_created_exists = 0 THEN
    CREATE INDEX IDX_COMMENT_THEME_CREATED_AT ON COMMENTS(GAME_THEME_ID, CREATED_AT DESC);
  END IF;
END IF;

-- COMMENT_LIKES 테이블이 존재할 경우에만 인덱스 작업 실행
SET @comment_likes_exists_final = (SELECT COUNT(*) FROM information_schema.tables 
                                  WHERE table_schema = '${DB_DISCORD}' AND table_name = 'COMMENT_LIKES');

IF @comment_likes_exists_final > 0 THEN
  -- COMMENT_LIKES 테이블 인덱스 존재 여부 확인
  SET @idx_like_user_exists = (SELECT COUNT(*) FROM information_schema.statistics
                             WHERE table_schema = '${DB_DISCORD}'
                             AND table_name = 'COMMENT_LIKES'
                             AND index_name = 'IDX_COMMENT_LIKE_USER_ID');

  SET @idx_like_comment_exists = (SELECT COUNT(*) FROM information_schema.statistics
                                WHERE table_schema = '${DB_DISCORD}'
                                AND table_name = 'COMMENT_LIKES'
                                AND index_name = 'IDX_COMMENT_LIKE_COMMENT_ID');

  -- 필요한 인덱스만 생성
  IF @idx_like_user_exists = 0 THEN
    CREATE INDEX IDX_COMMENT_LIKE_USER_ID ON COMMENT_LIKES(USER_ID);
  END IF;

  IF @idx_like_comment_exists = 0 THEN
    CREATE INDEX IDX_COMMENT_LIKE_COMMENT_ID ON COMMENT_LIKES(COMMENT_ID);
  END IF;
END IF;

-- 테이블 새로 생성되지 않으면 메시지 출력
IF @comments_exists = 0 AND @comments_exists_final = 0 THEN
  SELECT 'COMMENTS 테이블을 생성하지 않았습니다. 참조하는 테이블이 존재하지 않습니다.' AS message;
ELSEIF @comments_exists > 0 THEN
  SELECT 'COMMENTS 테이블이 이미 존재합니다.' AS message;
END IF;

IF @comment_likes_exists = 0 AND @comment_likes_exists_final = 0 AND @comments_exists_now > 0 THEN
  SELECT 'COMMENT_LIKES 테이블을 생성하지 않았습니다. 오류가 발생했을 수 있습니다.' AS message;
ELSEIF @comment_likes_exists > 0 THEN
  SELECT 'COMMENT_LIKES 테이블이 이미 존재합니다.' AS message;
END IF;
