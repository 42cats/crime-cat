-- =========================================
-- V1.4.0_001: Discord 자동화 버튼 시스템 테이블 생성 (단순화된 버전)
-- 작성일: 2025-01-21
-- 목적: JSON 기반의 유연한 버튼 자동화 시스템 구현
-- =========================================

USE ${DB_DISCORD};

-- 마이그레이션 시작 로그
SELECT 'Starting Simplified Button Automation System migration...' as status;

-- 1. 자동화 그룹 테이블 생성
CREATE TABLE IF NOT EXISTS button_automation_groups (
  id VARCHAR(100) PRIMARY KEY COMMENT '그룹 고유 ID',
  guild_id VARCHAR(50) NOT NULL COMMENT 'Discord 길드 ID',
  name VARCHAR(100) NOT NULL COMMENT '그룹 이름',
  display_order INT DEFAULT 0 COMMENT '그룹 표시 순서',
  settings JSON COMMENT '그룹 설정 (메시지, 이모지 등)',
  is_active BOOLEAN DEFAULT TRUE COMMENT '그룹 활성화 상태',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_guild_name (guild_id, name),
  INDEX idx_guild_order (guild_id, display_order),
  INDEX idx_guild_active (guild_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 자동화 버튼 테이블 생성 (JSON 중심 설계)
CREATE TABLE IF NOT EXISTS button_automations (
  id VARCHAR(100) PRIMARY KEY COMMENT '버튼 고유 ID',
  guild_id VARCHAR(50) NOT NULL COMMENT 'Discord 길드 ID',
  group_id VARCHAR(100) COMMENT '소속 그룹 ID',
  button_label VARCHAR(100) NOT NULL COMMENT '버튼 표시 텍스트',
  display_order INT DEFAULT 0 COMMENT '그룹 내 버튼 표시 순서',
  config JSON NOT NULL COMMENT '전체 버튼 설정 (트리거, 액션, 옵션, UI 등)',
  is_active BOOLEAN DEFAULT TRUE COMMENT '버튼 활성화 상태',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES button_automation_groups(id) ON DELETE CASCADE,
  UNIQUE KEY uk_guild_label (guild_id, button_label),
  INDEX idx_guild_group (guild_id, group_id),
  INDEX idx_group_order (group_id, display_order),
  INDEX idx_guild_active (guild_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 테이블 생성 확인
SELECT 'Checking created tables...' as status;

SELECT 
  TABLE_NAME as table_name,
  TABLE_ROWS as estimated_rows,
  CREATE_TIME as created_time
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME LIKE 'button_automation%'
ORDER BY TABLE_NAME;

-- 4. JSON 스키마 예시 및 설명
SELECT '
JSON 구조 예시:

groups.settings:
{
  "messageContent": "아래 버튼을 클릭하세요!",
  "messageEmojis": ["🎮", "🎯"]
}

button_automations.config:
{
  "trigger": {
    "type": "role",
    "value": "123456789"
  },
  "actions": [
    {
      "type": "add_role",
      "order": 1,
      "target": "executor",
      "parameters": {"roleId": "987654321"},
      "conditions": {
        "requiredRoles": ["role1"],
        "deniedRoles": ["blocked"]
      },
      "delay": 3,
      "result": {
        "message": {
          "type": "custom",
          "content": "{user}님 역할 추가됨!",
          "visibility": "public",
          "deleteAfter": 10
        }
      }
    }
  ],
  "options": {
    "oncePerUser": true,
    "cooldownSeconds": 60,
    "prompt": {
      "enabled": false
    }
  },
  "ui": {
    "style": "primary",
    "disableAfter": true,
    "renameAfter": "✅ 완료"
  }
}
' as json_schema_examples;

SELECT 'Simplified Button automation system tables created successfully!' as status;
SELECT 'Migration V1.4.0_001 completed. Only 2 tables created for maximum flexibility.' as result;