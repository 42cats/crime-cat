# 백엔드 개발 가이드

## 🎯 빠른 시작
```bash
./gradlew bootRun  # 개발 서버 시작 (포트: 8080)
./gradlew test     # 테스트 실행
```

**권장 개발 환경**: IntelliJ IDEA에서 직접 실행

## 🏗️ 아키텍처
- [Spring 설정](architecture/spring-config.md) - Bean, Profile, Configuration
- [보안 시스템](architecture/security.md) - JWT, Discord OAuth2  
- [데이터베이스](architecture/database.md) - JPA, Repository 패턴
- [예외 처리](architecture/exception-handling.md) - ErrorStatus 시스템

## ⚙️ 핵심 기능
- [일정 관리](features/schedule-system.md) ⭐ **최신 완성 (v2.0)**
- [사용자 관리](features/user-management.md) - Discord ↔ Web 사용자 연동
- [캘린더 동기화](features/calendar-sync.md) - iCal 실시간 파싱 (30분 캐시)
- [추천 시스템](features/recommendation.md) - AI 기반 시간 추천

## 🚀 API 개발
- [REST 컨트롤러](api/rest-controllers.md) - 표준 패턴 & 규칙
- [DTO 매핑](api/dto-mapping.md) - Entity ↔ DTO 변환 전략
- [입력 검증](api/validation.md) - Validation 규칙 & 에러 처리

## 🔧 인프라
- [Redis 캐시](infrastructure/redis-cache.md) ⚠️ **Bean 충돌 해결법 포함**
- [데이터베이스 마이그레이션](infrastructure/database-migration.md) - Flyway 관리
- [모니터링](infrastructure/monitoring.md) - 로깅 & 메트릭

## 🆘 문제 해결
- [Redis 이슈](troubleshooting/redis-issues.md) - @Primary 추가로 Bean 충돌 해결
- [공통 오류](troubleshooting/common-errors.md) - 자주 발생하는 에러들
- [성능 최적화](troubleshooting/performance.md) - 쿼리 & 캐시 최적화

## 📊 기술 스택

### Core
- **Java 21** + **Spring Boot 3.4.3**
- **Gradle** 빌드 도구
- **MariaDB** + **Spring Data JPA**

### Security
- **Spring Security** (JWT + Discord OAuth2)
- **이중 인증 경로**: Web (JWT) + Bot (Bearer Token)

### Caching & Messaging  
- **Redis** (캐싱 + Pub/Sub)
- **다중 RedisTemplate**: 캐시용, Pub/Sub용 분리

### Monitoring
- **Spring Boot Actuator**
- **SLF4J + Logback**

## 🎯 개발 규칙

### 필수 규칙
1. **Read First**: 파일 수정 전 반드시 Read 도구 사용
2. **Exception Handling**: ErrorStatus 패턴 사용 필수
3. **API Standards**: [REST 컨트롤러 가이드](api/rest-controllers.md) 준수
4. **Caching**: Redis 캐시 전략 적용
5. **Testing**: 핵심 로직 테스트 커버리지 >80%

### 코드 스타일
```java
// ✅ 올바른 서비스 패턴
@Service
@RequiredArgsConstructor
@Transactional
public class ScheduleService {
    
    private final ScheduleRepository repository;
    
    @Transactional(readOnly = true)
    public MyResponse getData(String param) {
        try {
            validateInput(param);
            Entity entity = repository.findByParam(param)
                .orElseThrow(() -> new ServiceException(ErrorStatus.NOT_FOUND));
            return MyResponse.from(entity);
        } catch (ServiceException e) {
            throw e; // 명확한 예외는 그대로 전파
        } catch (Exception e) {
            log.error("Unexpected error: {}", e.getMessage(), e);
            throw new ServiceException(ErrorStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
```

## 🔄 최신 업데이트 내용

### v2.0 완성 기능 (2025-08-28)
1. **Discord 봇 일정 관리**: `/내일정`, `/일정체크`, `/일정갱신` 명령어
2. **실시간 iCal 파싱**: Google/Apple/Outlook 캘린더 지원
3. **Redis 캐시 시스템**: 30분 TTL, Bean 충돌 해결
4. **한국어 날짜 포맷**: "8월 28 29, 9월 3 4" 형식 지원
5. **완전한 예외 처리**: 10개 Discord 전용 ErrorStatus 추가

### 진행 중 (Phase 8-10)
- 이중 추천 시스템 UI
- 이벤트 상세 모달
- 통합 테스트 & 최적화

## 🔗 연관 서비스
- [프론트엔드 API 연동](../frontend/api-integration/api-client.md)
- [Discord 봇 API](../discord-bot/api-integration/backend-api.md)
- [공통 API 계약](../shared/api-contracts.md)
- [데이터베이스 스키마](../shared/database-schema.md)