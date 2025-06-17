# 다중 채널 기능 구현 전 기술적 검토 요청

안녕하세요! Mystery Place Voice Chat 프로젝트에 **다중 채널 기능**을 추가하려고 합니다. 구현 전에 몇 가지 기술적 설계에 대한 조언을 구하고자 합니다.

## 현재 상황
- **기존**: 단일 채팅방 + Redis 비동기 버퍼링 + 배치 쓰기 시스템 완료
- **목표**: 채널별 분리된 채팅 + 비밀번호 보호 + 채널별 권한 관리

## 주요 설계 이슈

### 1. Redis 버퍼링 전략
**현재**: `chat:buffer` (단일 키)  
**변경 예정**: `chat:buffer:<channelId>` (채널별 분리)

**질문**: 
- 채널이 많아질 경우 (100+ 채널) Redis 메모리 사용량 최적화 방법?
- 비활성 채널의 버퍼 정리 전략?
- 채널별 배치 처리 시 동시성 이슈는 없을까요?

### 2. Socket.IO Room 관리
```js
// 현재 계획
socket.join(`channel:${channelId}`);
io.to(`channel:${channelId}`).emit('chat:message', msg);
```

**질문**:
- 사용자가 여러 채널을 동시에 참여할 수 있어야 할까요?
- 채널 삭제 시 모든 참여자를 강제 퇴장시키는 것이 적절할까요?
- Room 기반 브로드캐스트의 성능 제한은?

### 3. 데이터베이스 스키마 설계
```sql
CREATE TABLE ChatChannel (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255), -- BCrypt 해시
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ChatMessage ADD COLUMN channel_id BIGINT NOT NULL;
```

**질문**:
- 채널명 중복 방지를 위한 UNIQUE 제약조건이 적절할까요?
- 채널 삭제 시 관련 메시지들도 CASCADE DELETE할지, 아니면 보관할지?
- `channel_id`에 대한 인덱싱 전략?

### 4. 보안 및 권한 관리
**비밀번호 보호 채널**:
- BCrypt 해시 저장 + 입장 시 검증
- JWT에 채널 접근 권한 포함할지, 별도 세션 관리할지?

**채널 관리자 권한**:
- 생성자만 삭제 가능
- 관리자 권한 위임 기능 필요할까요?

### 5. 성능 최적화
**예상 규모**: 동시 접속자 100명, 채널 20-30개

**우려사항**:
- 채널별 메시지 히스토리 로딩 성능
- 실시간 사용자 목록 업데이트 (채널 입장/퇴장)
- Redis + DB 간 일관성 보장

### 6. UI/UX 고려사항
```
[채널 목록] [선택된 채널 채팅] [참여자 목록]
```

**질문**:
- 채널 알림 시스템 (새 메시지 배지) 구현 방법?
- 비활성 채널의 자동 퇴장 정책?
- 채널별 음성 채팅도 분리해야 할까요?

## 구현 우선순위 제안
1. 데이터베이스 스키마 변경 + 마이그레이션
2. 백엔드 채널 관리 API
3. 시그널 서버 Room 기반 분리
4. 프론트엔드 채널 UI
5. 비밀번호 보호 기능
6. 채널별 권한 관리

위 설계 방향에 대한 조언과 개선 제안을 부탁드립니다!