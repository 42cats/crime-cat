# Crime-Cat 프로젝트 및 일정 관리 기능 개발 요약

## 1. 프로젝트 개요: Crime-Cat

`Crime-Cat` 프로젝트는 폴더 구조와 의존성 분석을 통해 볼 때, Discord 봇 통합 기능을 포함하는 웹 기반의 커뮤니티 또는 서비스 플랫폼으로 보입니다. 사용자 게시물, 게임 테마, 길드 관리 등 다양한 기능을 제공하며, 고성능과 확장성을 지향하는 아키텍처를 갖추고 있습니다.

**주요 기술 스택:**
*   **백엔드:** Java 21, Spring Boot 3.4.3 (Gradle 기반)
    *   **데이터베이스:** MariaDB (HikariCP, JPA)
    *   **보안:** Spring Security, Discord OAuth2, JWT
    *   **캐싱:** Redis, Hibernate 2차 캐시 (Ehcache), Caffeine (다중 계층 캐싱)
    *   **웹 클라이언트:** Spring WebFlux (WebClient)
    *   **알림:** 자체 알림 시스템 (이메일, 템플릿 엔진 포함)
*   **프론트엔드:** React (Vite 기반), TypeScript, Tailwind CSS, shadcn/ui
*   **배포:** Docker 기반 (컨테이너화)

## 2. 구현된 기능: 일정 관리 시스템

사용자들이 일정을 생성하고, 참여하며, 서로의 스케줄을 교차 확인하여 최적의 시간을 찾는 기능을 백엔드에 구현했습니다.

### 2.1. 데이터베이스 스키마 (`V1.6.0_001_create_schedule_tables.sql`)

새로운 기능에 필요한 3개의 테이블을 정의했습니다. 모든 테이블의 ID는 `BINARY(16)` (UUID) 타입을 사용하며, `web_users` 테이블과 외래 키 관계를 가집니다.

*   **`events` 테이블:**
    *   일정의 기본 정보 (생성자, 제목, 설명, 카테고리, 상태, 최대 참여 인원, 확정된 일정 시간)를 저장합니다.
    *   `max_participants` 컬럼을 추가하여 일정별 참여 인원 제한을 설정할 수 있습니다.
    *   `status` 컬럼은 `RECRUITING`, `RECRUITMENT_COMPLETE`, `COMPLETED`, `CANCELLED` 상태를 가집니다.
*   **`event_participants` 테이블:**
    *   특정 일정에 참여하는 사용자 정보를 기록합니다.
    *   `event_id`와 `user_id`의 복합 유니크 키를 가집니다.
*   **`user_calendars` 테이블:**
    *   사용자가 등록한 iCalendar (ICS) URL을 저장합니다. 이를 통해 외부 캘린더 데이터를 가져올 수 있습니다.

### 2.2. 백엔드 구현 (Spring Boot)

기존 프로젝트의 기능별 패키지 구조를 따라 `com.crimecat.backend.schedule` 패키지 내에 모든 관련 코드를 구현했습니다.

*   **엔티티 (Entities):**
    *   `Event.java`: `events` 테이블과 매핑되는 JPA 엔티티. `EventStatus` Enum을 사용하여 상태를 관리합니다.
    *   `EventParticipant.java`: `event_participants` 테이블과 매핑되는 JPA 엔티티.
    *   `UserCalendar.java`: `user_calendars` 테이블과 매핑되는 JPA 엔티티.
    *   `EventStatus.java`: 일정의 상태를 정의하는 Enum (`RECRUITING`, `RECRUITMENT_COMPLETE`, `COMPLETED`, `CANCELLED`).
*   **레포지토리 (Repositories):**
    *   `EventRepository.java`: `Event` 엔티티의 CRUD 및 필터링 쿼리 (`findByCategory`, `findByStatus` 등)를 담당합니다.
    *   `EventParticipantRepository.java`: `EventParticipant` 엔티티의 CRUD 및 특정 일정의 참여자 수 (`countByEvent`), 특정 사용자의 참여 여부 (`existsByEventAndUser`), 일정 참여자 목록 (`findByEvent`) 조회를 담당합니다.
    *   `UserCalendarRepository.java`: `UserCalendar` 엔티티의 CRUD 및 사용자별 캘린더 조회 (`findByUser`)를 담당합니다.
*   **DTO (Data Transfer Objects):**
    *   `EventCreateRequest.java`: 일정 생성 요청 시 사용되는 데이터.
    *   `EventResponse.java`: 일정 조회 응답 시 사용되는 데이터. `COMPLETED` 상태를 동적으로 처리하는 로직을 포함합니다.
    *   `UserCalendarRequest.java`: iCalendar URL 등록 요청 시 사용되는 데이터.
*   **서비스 (Service Layer - `ScheduleService.java`):**
    *   **`createEvent`**: 새 일정 생성 및 초기 상태 설정.
    *   **`joinEvent`**: 일정 참여 로직. 참여 인원 제한 및 중복 참여 검사. (알림 트리거 TODO 포함)
    *   **`getEvents`**: 카테고리 및 상태별 일정 목록 조회.
    *   **`getEvent`**: 특정 일정 상세 조회.
    *   **`saveUserCalendar`**: 사용자의 iCalendar URL 저장/업데이트.
    *   **`fetchAndParseIcal`**: iCalendar URL에서 데이터를 가져와 파싱하는 헬퍼 메소드.
    *   **`calculateAvailability`**: **핵심 로직**. 참여자들의 iCalendar 데이터를 파싱하여 모든 참여자가 가능한 공통의 자유 시간대를 계산합니다. (시간 간격 병합 및 교차 분석 알고리즘 포함)
*   **컨트롤러 (Controller Layer - `ScheduleController.java`):**
    *   `@RequestMapping("/api/v1/schedule")`
    *   `POST /events`: 일정 생성.
    *   `POST /events/{eventId}/join`: 일정 참여.
    *   `GET /events`: 일정 목록 조회 (필터링 가능).
    *   `GET /events/{eventId}`: 특정 일정 상세 조회.
    *   `POST /my-calendar`: 사용자 iCalendar URL 등록.
    *   `GET /events/{eventId}/availability`: 일정 가능 시간 조회.
*   **새로운 의존성:** `ical4j` 라이브러리를 `build.gradle`에 추가하여 iCalendar 데이터 파싱을 지원합니다.

## 3. 남은 작업 (Next Steps)

현재까지 일정 관리 시스템의 핵심 백엔드 로직은 대부분 구현되었습니다. 하지만 몇 가지 중요한 기능들이 남아있습니다.

*   **알림 기능 통합:**
    *   `ScheduleService`에 `NotificationService`를 주입하고, `EVENT_JOINED`, `EVENT_CONFIRMED` 등 새로운 `NotificationType`을 사용하여 알림을 발송하는 로직을 구현해야 합니다.
    *   **트리거 시점:** 사용자가 일정에 참여했을 때 (생성자에게 알림), 일정이 확정되었을 때 (모든 참여자에게 알림).
*   **`.ics` 파일 생성 및 내보내기:**
    *   확정된 일정을 사용자의 캘린더에 등록할 수 있도록 `.ics` 파일을 동적으로 생성하여 제공하는 기능을 구현해야 합니다. `ical4j` 라이브러리를 활용할 수 있습니다.
*   **일정 확정 기능:**
    *   일정 생성자가 특정 날짜와 시간으로 일정을 확정할 수 있는 API 엔드포인트와 `ScheduleService` 로직을 구현해야 합니다. 이 기능은 알림 발송을 트리거할 것입니다.
*   **프론트엔드 통합:**
    *   현재 구현된 백엔드 API를 활용하여 React 기반의 프론트엔드에서 일정 관리 UI를 개발해야 합니다. (대시보드 페이지 신설, 일정 목록, 상세, 생성, 참여, 캘린더 연동 등)
*   **모바일 앱 전략:**
    *   궁극적으로 웹과 모바일 앱(Android/iOS) 모두에서 동작하도록 하려면, 현재 웹 프론트엔드를 PWA로 확장하거나, React Native/Flutter와 같은 하이브리드 프레임워크를 사용하여 모바일 앱을 개발하는 것을 고려해야 합니다.

이 요약본이 프로젝트의 현재 상태를 이해하는 데 도움이 되기를 바랍니다.
