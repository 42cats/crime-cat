package com.crimecat.backend.schedule.service;

import com.crimecat.backend.schedule.domain.UserCalendar;
import com.crimecat.backend.schedule.repository.UserCalendarRepository;
import com.crimecat.backend.schedule.dto.request.CalendarCreateRequest;
import com.crimecat.backend.schedule.dto.request.CalendarUpdateRequest;
import com.crimecat.backend.schedule.dto.response.CalendarResponse;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import com.crimecat.backend.exception.ErrorStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.fortuna.ical4j.data.CalendarBuilder;
import net.fortuna.ical4j.model.Calendar;
import net.fortuna.ical4j.model.Component;
import net.fortuna.ical4j.model.Property;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.Summary;
import net.fortuna.ical4j.model.property.DtStart;
import net.fortuna.ical4j.model.property.DtEnd;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.io.StringReader;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 다중 iCalendar 관리 서비스
 * - 여러 캘린더 동기화
 * - 캘린더별 이벤트 그룹화
 * - 캘린더 이름 추출 및 색상 관리
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MultipleCalendarService {

    private final UserCalendarRepository userCalendarRepository;
    private final WebUserRepository webUserRepository;
    private final CalendarColorManager colorManager;
    private final RestTemplate restTemplate;
    
    @PersistenceContext
    private EntityManager entityManager;

    /**
     * 사용자의 모든 활성 캘린더 동기화
     */
    @Transactional
    public void syncAllUserCalendars(UUID userId) {
        log.info("🔄 [SYNC_START] Starting sync for user: {}", userId);
        
        List<UserCalendar> calendars = userCalendarRepository.findByUserIdAndIsActiveOrderBySortOrder(userId, true);
        
        log.info("📋 [SYNC_CALENDARS] Found {} active calendars to sync", calendars.size());
        
        for (UserCalendar calendar : calendars) {
            // 각 캘린더 동기화 (단일 트랜잭션에서 처리)
            try {
                syncSingleCalendarWithTransaction(calendar);
            } catch (Exception e) {
                log.error("❌ [SYNC_INDIVIDUAL_FAILED] Calendar {} sync failed in batch: {}", 
                    calendar.getId(), e.getMessage());
                // 개별 실패해도 다른 캘린더는 계속 진행
            }
        }
        
        log.info("🏁 [SYNC_COMPLETE] Sync completed for user: {}", userId);
    }

    /**
     * 개별 캘린더 동기화 (단순화된 트랜잭션)
     */
    @Transactional
    public void syncSingleCalendarWithTransaction(UserCalendar calendar) {
        LocalDateTime syncAttemptTime = LocalDateTime.now();
        
        log.info("🕰 [TX_START] 트랜잭션 시작: {}", syncAttemptTime);
        log.info("📅 [SYNC_CALENDAR] Starting sync for calendar: {}", calendar.getId());
        
        // ✅ 핵심 수정: Entity를 다시 조회하여 Persistent 상태 보장
        UserCalendar managedCalendar = userCalendarRepository.findById(calendar.getId())
                .orElseThrow(() -> new IllegalStateException("Calendar not found: " + calendar.getId()));
        
        // EntityManager 상태 확인 로그
        log.info("🔍 [ENTITY_STATE] Entity managed: {}, ID: {}", 
            entityManager.contains(managedCalendar), managedCalendar.getId());
        log.info("🔍 [BEFORE_SYNC] Current status: {} | Error: {} | LastSync: {}", 
            managedCalendar.getSyncStatus(), 
            managedCalendar.getSyncErrorMessage(), 
            managedCalendar.getLastSyncedAt());
        
        log.info("🔄 [BEFORE_INNER_SYNC] 내부 동기화 전: {}", managedCalendar.getLastSyncedAt());
        
        // 순수 함수로 iCal 데이터 처리 (URL은 변경되지 않으므로 기존 객체 사용 가능)
        SyncResult syncResult = syncSingleCalendar(managedCalendar.getIcalUrl());
        
        log.info("🔄 [AFTER_INNER_SYNC] 동기화 결과: {}", syncResult);
        
        // 결과에 따라 엔티티 업데이트 (모든 경우를 여기서 처리)
        if (syncResult.isSuccess()) {
            // 완전한 성공
            log.info("✅ [SYNC_SUCCESS] Calendar {} synced successfully", managedCalendar.getId());
            managedCalendar.setSyncStatus(UserCalendar.SyncStatus.SUCCESS);
            managedCalendar.setLastSyncedAt(syncAttemptTime);
            // updatedAt은 DB에서 자동 관리 (ON UPDATE current_timestamp())
            managedCalendar.setSyncErrorMessage(null);
            
            // 캘린더 이름 업데이트
            if (syncResult.hasCalendarName()) {
                String newCalendarName = syncResult.getCalendarName();
                if (!newCalendarName.equals(managedCalendar.getCalendarName())) {
                    log.info("🔄 Updating calendar name from '{}' to '{}'", 
                        managedCalendar.getCalendarName(), newCalendarName);
                    managedCalendar.setCalendarName(newCalendarName);
                    
                    // displayName이 없으면 calendarName으로 설정
                    if (managedCalendar.getDisplayName() == null || managedCalendar.getDisplayName().trim().isEmpty()) {
                        managedCalendar.setDisplayName(newCalendarName);
                        log.info("🏷️ Set display name to: {}", newCalendarName);
                    }
                }
            }
            
        } else if (syncResult.isPartialSuccess()) {
            // 부분적 성공 (404 등)
            log.warn("⚠️ [PARTIAL_SUCCESS] Calendar {} partially succeeded", managedCalendar.getId());
            managedCalendar.setSyncStatus(UserCalendar.SyncStatus.SUCCESS);
            managedCalendar.setLastSyncedAt(syncAttemptTime);
            // updatedAt은 DB에서 자동 관리 (ON UPDATE current_timestamp())
            managedCalendar.setSyncErrorMessage(syncResult.getErrorMessage());
            
        } else {
            // 완전한 실패
            log.error("❌ [SYNC_FAILED] Calendar {} sync failed", managedCalendar.getId());
            managedCalendar.setSyncStatus(UserCalendar.SyncStatus.ERROR);
            managedCalendar.setLastSyncedAt(syncAttemptTime);
            // updatedAt은 DB에서 자동 관리 (ON UPDATE current_timestamp())
            managedCalendar.setSyncErrorMessage(syncResult.getErrorMessage());
            
            // displayName이 없으면 기본값 설정
            if (managedCalendar.getDisplayName() == null || managedCalendar.getDisplayName().trim().isEmpty()) {
                String fallbackName = managedCalendar.getCalendarName() != null && !managedCalendar.getCalendarName().trim().isEmpty()
                    ? managedCalendar.getCalendarName()
                    : "외부 캘린더";
                managedCalendar.setDisplayName(fallbackName);
                log.info("🏷️ Set fallback display name to: {}", fallbackName);
            }
        }
        
        log.info("🔍 [AFTER_SYNC] Final status: {} | Error: {} | LastSync: {}", 
            managedCalendar.getSyncStatus(), 
            managedCalendar.getSyncErrorMessage(), 
            managedCalendar.getLastSyncedAt());
        
        log.info("💾 [BEFORE_SAVE] 저장 전 상태: lastSyncedAt={}, status={}", 
                managedCalendar.getLastSyncedAt(), managedCalendar.getSyncStatus());
        
        UserCalendar savedCalendar = userCalendarRepository.save(managedCalendar);
        
        log.info("💾 [AFTER_SAVE] 저장 후 상태: lastSyncedAt={}, status={}", 
                savedCalendar.getLastSyncedAt(), savedCalendar.getSyncStatus());
        
        // 트랜잭션 강제 flush
        entityManager.flush();
        log.info("🔄 [AFTER_FLUSH] EntityManager flush 완료");
        
        log.info("🕰 [TX_END] 트랜잭션 종료: {}", LocalDateTime.now());
    }

    /**
     * webcal:// URL을 https://로 변환 (Apple Calendar 지원)
     */
    private String normalizeWebcalUrl(String icalUrl) {
        if (icalUrl == null) return null;
        
        String trimmedUrl = icalUrl.trim();
        if (trimmedUrl.startsWith("webcal://")) {
            String httpsUrl = trimmedUrl.replace("webcal://", "https://");
            log.info("🔄 webcal URL 변환: {} → {}", icalUrl, httpsUrl);
            return httpsUrl;
        }
        
        return trimmedUrl;
    }

    /**
     * URL 정규화 - 다중 인코딩 문제 해결
     */
    private String normalizeIcalUrl(String originalUrl) {
        try {
            String processedUrl = originalUrl;
            int iterations = 0;
            final int maxIterations = 5;
            
            // 다중 URL 인코딩 해결
            while (iterations < maxIterations && 
                   (processedUrl.contains("%25") || processedUrl.contains("%40") || processedUrl.contains("%3A") || processedUrl.contains("%2F"))) {
                
                String beforeDecode = processedUrl;
                processedUrl = URLDecoder.decode(processedUrl, StandardCharsets.UTF_8);
                
                log.debug("🔧 URL decode iteration {}: {} -> {}", iterations + 1, beforeDecode, processedUrl);
                
                // 무한 루프 방지: 디코딩 후 변화가 없으면 중단
                if (beforeDecode.equals(processedUrl)) {
                    log.debug("🔧 URL decode converged at iteration {}", iterations + 1);
                    break;
                }
                
                iterations++;
            }
            
            if (iterations >= maxIterations) {
                log.warn("⚠️ URL normalization reached max iterations for: {}", originalUrl);
            }
            
            if (!originalUrl.equals(processedUrl)) {
                log.info("🔧 URL normalization: {} -> {}", originalUrl, processedUrl);
            }
            
            return processedUrl;
            
        } catch (Exception e) {
            log.warn("⚠️ URL normalization failed for: {} | Error: {}", originalUrl, e.getMessage());
            return originalUrl;
        }
    }

    /**
     * 단일 캘린더 동기화 - 순수 함수 (엔티티 수정 없음)
     * @param icalUrl iCal URL
     * @return 동기화 결과 (성공/실패/부분성공)
     */
    private SyncResult syncSingleCalendar(String icalUrl) {
        try {
            log.info("🔗 Starting iCal sync for URL: {}", icalUrl);
            
            // URL 정규화
            String processedUrl = normalizeIcalUrl(icalUrl);
            if (!icalUrl.equals(processedUrl)) {
                log.info("🔧 Using normalized URL: {}", processedUrl);
            }
            
            // iCal 데이터 가져오기 (URI 객체 사용으로 재인코딩 방지)
            log.info("🌐 Making HTTP request to: {}", processedUrl);
            String icalData;
            try {
                URI uri = URI.create(processedUrl);
                log.debug("🔗 Using URI object: {}", uri);
                icalData = restTemplate.getForObject(uri, String.class);
            } catch (Exception httpException) {
                log.error("❌ HTTP request failed: {}", httpException.getMessage());
                
                // 404 오류는 부분적 실패로 처리 (캘린더 삭제됨/비공개 처리)
                if (httpException.getMessage().contains("404")) {
                    log.warn("📱 Calendar appears to be deleted or private, treating as partial success");
                    log.info("🔍 Possible reasons:");
                    log.info("   - Calendar became private or was deleted");
                    log.info("   - URL encoding issues (resolved in next sync)");
                    log.info("   - Original URL: {}", icalUrl);
                    log.info("   - Processed URL: {}", processedUrl);
                    
                    return SyncResult.partialSuccess("Calendar is private or deleted (404)");
                }
                
                // 다른 오류는 실패로 처리
                throw httpException;
            }
            
            if (icalData == null || icalData.trim().isEmpty()) {
                log.error("📭 Empty iCal data received from: {}", processedUrl);
                return SyncResult.failure("Empty iCal data received");
            }
            
            log.info("✅ Successfully fetched iCal data, size: {} chars", icalData.length());

            // iCal 파싱
            CalendarBuilder builder = new CalendarBuilder();
            Calendar calendar = builder.build(new StringReader(icalData));
            log.info("📅 Successfully parsed iCal data");

            // 캘린더 이름 추출
            String calendarName = extractCalendarName(calendar);
            log.info("🏷️  Extracted calendar name: {}", calendarName);
            
            log.info("✅ Successfully processed iCal data");
            return SyncResult.success(calendarName);

        } catch (Exception e) {
            log.error("❌ Failed to sync iCal data: {}", e.getMessage());
            log.error("🔍 Error details: ", e);
            return SyncResult.failure("Calendar sync failed: " + e.getMessage());
        }
    }

    /**
     * iCalendar에서 캘린더 이름 추출
     * 우선순위: X-WR-CALNAME > PRODID > URL 기반 추측
     */
    private String extractCalendarName(Calendar calendar) {
        try {
            // 1순위: X-WR-CALNAME (가장 일반적)
            Property calName = calendar.getProperty("X-WR-CALNAME");
            if (calName != null && !calName.getValue().trim().isEmpty()) {
                return calName.getValue().trim();
            }

            // 2순위: PRODID에서 추출
            Property prodId = calendar.getProperty(Property.PRODID);
            if (prodId != null) {
                String prodIdValue = prodId.getValue();
                if (prodIdValue.contains("Google")) {
                    return "Google Calendar";
                } else if (prodIdValue.contains("Apple")) {
                    return "Apple Calendar";
                } else if (prodIdValue.contains("Outlook") || prodIdValue.contains("Microsoft")) {
                    return "Outlook Calendar";
                }
            }

            // 3순위: 기본값
            return "개인 캘린더";

        } catch (Exception e) {
            log.warn("Failed to extract calendar name, using default", e);
            return "개인 캘린더";
        }
    }

    /**
     * 사용자 캘린더 목록 조회
     */
    public List<CalendarResponse> getUserCalendars(UUID userId, boolean activeOnly) {
        log.info("📋 [CALENDAR_LIST] 캘린더 목록 조회: userId={}, activeOnly={}", userId, activeOnly);
        
        List<UserCalendar> calendars;
        
        if (activeOnly) {
            calendars = userCalendarRepository.findByUserIdAndIsActiveOrderBySortOrder(userId, true);
        } else {
            calendars = userCalendarRepository.findByUserIdOrderBySortOrder(userId);
        }

        return calendars.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * 별도 트랜잭션에서 사용자 캘린더 목록 조회 (JPA 1차 캐시 격리)
     * - 동기화 후 최신 데이터 보장
     * - 트랜잭션 격리로 인한 lastSyncedAt 미반영 문제 해결
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public List<CalendarResponse> getUserCalendarsInNewTransaction(UUID userId, boolean activeOnly) {
        log.info("🔄 [NEW_TRANSACTION] 별도 트랜잭션에서 최신 캘린더 목록 조회: userId={}, activeOnly={}", userId, activeOnly);
        
        List<UserCalendar> calendars;
        
        if (activeOnly) {
            calendars = userCalendarRepository.findByUserIdAndIsActiveOrderBySortOrder(userId, true);
        } else {
            calendars = userCalendarRepository.findByUserIdOrderBySortOrder(userId);
        }

        log.info("✅ [NEW_TRANSACTION] 최신 캘린더 데이터 조회 완료: {} 개", calendars.size());
        
        // 최신 데이터 확인 로그
        for (UserCalendar calendar : calendars) {
            log.info("✅ [NEW_TRANSACTION] 최신 캘린더: id={}, name={}, lastSyncedAt={}", 
                    calendar.getId(), 
                    calendar.getDisplayName(), 
                    calendar.getLastSyncedAt());
        }

        return calendars.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * 새 캘린더 추가
     */
    @Transactional
    public CalendarResponse addCalendar(UUID userId, CalendarCreateRequest request) {
        // 1. 사용자 조회
        WebUser user = webUserRepository.findById(userId)
                .orElseThrow(() -> ErrorStatus.USER_NOT_FOUND.asServiceException());

        // 2. webcal:// → https:// 변환 (Apple Calendar 지원)
        String normalizedUrl = normalizeWebcalUrl(request.getIcalUrl());
        
        // 3. 중복 URL 체크 (정규화된 URL로)
        if (userCalendarRepository.existsByUserIdAndIcalUrl(userId, normalizedUrl)) {
            throw ErrorStatus.CALENDAR_ALREADY_EXISTS.asServiceException();
        }

        // 4. 다음 사용 가능한 색상 인덱스 할당
        int colorIndex = colorManager.getNextAvailableColorIndex(userId);
        int sortOrder = userCalendarRepository.countByUserId(userId);

        // 5. UserCalendar 생성 (User 포함)
        UserCalendar newCalendar = UserCalendar.builder()
                .user(user) // User 객체 설정
                .icalUrl(normalizedUrl) // 정규화된 URL 사용
                .displayName(request.getDisplayName())
                .colorIndex(colorIndex)
                .sortOrder(sortOrder)
                .isActive(true)
                .syncStatus(UserCalendar.SyncStatus.PENDING)
                .build();

        UserCalendar savedCalendar = userCalendarRepository.save(newCalendar);

        // 6. 초기 동기화 시도
        LocalDateTime syncAttemptTime = LocalDateTime.now();
        
        // 순수 함수로 동기화 시도
        SyncResult syncResult = syncSingleCalendar(savedCalendar.getIcalUrl());
        
        if (syncResult.isSuccess()) {
            savedCalendar.setSyncStatus(UserCalendar.SyncStatus.SUCCESS);
            savedCalendar.setLastSyncedAt(syncAttemptTime);
            // updatedAt은 DB에서 자동 관리 (ON UPDATE current_timestamp())
            savedCalendar.setSyncErrorMessage(null);
            
            // 캘린더 이름 업데이트
            if (syncResult.hasCalendarName()) {
                savedCalendar.setCalendarName(syncResult.getCalendarName());
                if (savedCalendar.getDisplayName() == null || savedCalendar.getDisplayName().trim().isEmpty()) {
                    savedCalendar.setDisplayName(syncResult.getCalendarName());
                }
            }
            
            log.info("Successfully added and synced new calendar: {}", savedCalendar.getId());
            
        } else if (syncResult.isPartialSuccess()) {
            savedCalendar.setSyncStatus(UserCalendar.SyncStatus.SUCCESS);
            savedCalendar.setLastSyncedAt(syncAttemptTime);
            // updatedAt은 DB에서 자동 관리 (ON UPDATE current_timestamp())
            savedCalendar.setSyncErrorMessage(syncResult.getErrorMessage());
            log.info("Added calendar with partial success: {}", savedCalendar.getId());
            
        } else {
            savedCalendar.setSyncStatus(UserCalendar.SyncStatus.ERROR);
            savedCalendar.setLastSyncedAt(syncAttemptTime);
            // updatedAt은 DB에서 자동 관리 (ON UPDATE current_timestamp())
            savedCalendar.setSyncErrorMessage(syncResult.getErrorMessage());
            
            // displayName이 없으면 기본값 설정
            if (savedCalendar.getDisplayName() == null || savedCalendar.getDisplayName().trim().isEmpty()) {
                savedCalendar.setDisplayName("외부 캘린더 (동기화 실패)");
            }
            
            log.error("Failed initial sync for new calendar: {} - {}", savedCalendar.getId(), syncResult.getErrorMessage());
        }

        UserCalendar finalSaved = userCalendarRepository.save(savedCalendar);
        
        // 7. DTO 변환 후 반환
        return convertToResponse(finalSaved);
    }

    /**
     * 캘린더별 그룹화된 이벤트 정보 반환
     */
    public Map<String, CalendarGroup> getGroupedCalendarEvents(UUID userId, LocalDate startDate, LocalDate endDate) {
        List<UserCalendar> calendars = userCalendarRepository.findByUserIdAndIsActiveOrderBySortOrder(userId, true);
        Map<String, CalendarGroup> groups = new LinkedHashMap<>();

        for (UserCalendar calendar : calendars) {
            try {
                List<CalendarEvent> events = fetchEventsFromCalendar(calendar, startDate, endDate);
                
                CalendarGroup group = CalendarGroup.builder()
                        .calendarId(calendar.getId())
                        .displayName(calendar.getDisplayName() != null ? calendar.getDisplayName() : "개인 캘린더")
                        .colorHex(colorManager.getColorByIndex(calendar.getColorIndex()))
                        .colorIndex(calendar.getColorIndex())
                        .events(events)
                        .lastSynced(calendar.getLastSyncedAt())
                        .syncStatus(calendar.getSyncStatus())
                        .build();

                groups.put(calendar.getId().toString(), group);
                
            } catch (Exception e) {
                log.error("Failed to fetch events from calendar: {}", calendar.getId(), e);
                
                // 오류가 발생한 캘린더도 빈 그룹으로 추가
                CalendarGroup errorGroup = CalendarGroup.builder()
                        .calendarId(calendar.getId())
                        .displayName(calendar.getDisplayName() != null ? calendar.getDisplayName() : "개인 캘린더")
                        .colorHex(colorManager.getColorByIndex(calendar.getColorIndex()))
                        .colorIndex(calendar.getColorIndex())
                        .events(Collections.emptyList())
                        .lastSynced(calendar.getLastSyncedAt())
                        .syncStatus(UserCalendar.SyncStatus.ERROR)
                        .syncError(e.getMessage())
                        .build();

                groups.put(calendar.getId().toString(), errorGroup);
            }
        }

        return groups;
    }

    /**
     * 특정 캘린더에서 이벤트 데이터 추출
     */
    private List<CalendarEvent> fetchEventsFromCalendar(UserCalendar userCalendar, LocalDate startDate, LocalDate endDate) {
        try {
            String originalUrl = userCalendar.getIcalUrl();
            log.debug("📅 Fetching events from calendar {} for date range {} to {}", 
                userCalendar.getId(), startDate, endDate);
            
            // URL 정규화
            String processedUrl = normalizeIcalUrl(originalUrl);
            
            URI uri = URI.create(processedUrl);
            String icalData = restTemplate.getForObject(uri, String.class);
            if (icalData == null) {
                log.debug("📭 No iCal data received for calendar: {}", userCalendar.getId());
                return Collections.emptyList();
            }

            CalendarBuilder builder = new CalendarBuilder();
            Calendar calendar = builder.build(new StringReader(icalData));

            List<CalendarEvent> events = calendar.getComponents(Component.VEVENT).stream()
                    .map(component -> (VEvent) component)
                    .map(event -> convertToCalendarEvent(event, userCalendar))
                    .filter(Objects::nonNull)
                    .filter(event -> isEventInDateRange(event, startDate, endDate))
                    .collect(Collectors.toList());
                    
            log.debug("📋 Found {} events in date range for calendar {}", events.size(), userCalendar.getId());
            return events;

        } catch (Exception e) {
            log.error("❌ Failed to fetch events from calendar: {}", userCalendar.getId(), e);
            return Collections.emptyList();
        }
    }

    /**
     * VEvent를 CalendarEvent로 변환
     */
    private CalendarEvent convertToCalendarEvent(VEvent vEvent, UserCalendar userCalendar) {
        try {
            Summary summary = vEvent.getSummary();
            DtStart dtStart = vEvent.getStartDate();
            DtEnd dtEnd = vEvent.getEndDate();

            if (summary == null || dtStart == null) {
                return null;
            }

            return CalendarEvent.builder()
                    .id(UUID.randomUUID().toString())
                    .title(summary.getValue())
                    .startTime(dtStart.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime())
                    .endTime(dtEnd != null ? dtEnd.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime() : null)
                    .allDay(dtStart.isUtc()) // 간단한 전일 이벤트 판별
                    .source("icalendar")
                    .calendarId(userCalendar.getId().toString())
                    .calendarName(userCalendar.getDisplayName())
                    .colorHex(colorManager.getColorByIndex(userCalendar.getColorIndex()))
                    .build();

        } catch (Exception e) {
            log.warn("Failed to convert VEvent to CalendarEvent", e);
            return null;
        }
    }

    /**
     * 이벤트가 날짜 범위 내에 있는지 확인
     */
    private boolean isEventInDateRange(CalendarEvent event, LocalDate startDate, LocalDate endDate) {
        LocalDate eventStartDate = event.getStartTime().toLocalDate();
        return !eventStartDate.isBefore(startDate) && !eventStartDate.isAfter(endDate);
    }

    /**
     * 캘린더 그룹 DTO
     */
    @lombok.Builder
    @lombok.Getter
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CalendarGroup {
        private UUID calendarId;
        private String displayName;
        private String colorHex;
        private Integer colorIndex;
        private List<CalendarEvent> events;
        private LocalDateTime lastSynced;
        private UserCalendar.SyncStatus syncStatus;
        private String syncError;
    }

    /**
     * 캘린더 수정
     */
    @Transactional
    public CalendarResponse updateCalendar(UUID calendarId, CalendarUpdateRequest request, UUID userId) {
        UserCalendar calendar = userCalendarRepository.findById(calendarId)
                .orElseThrow(() -> ErrorStatus.CALENDAR_NOT_FOUND.asServiceException());

        // 권한 체크
        if (!calendar.getUser().getId().equals(userId)) {
            throw ErrorStatus.CALENDAR_ACCESS_DENIED.asServiceException();
        }

        // 업데이트
        if (request.getDisplayName() != null) {
            calendar.setDisplayName(request.getDisplayName());
        }
        if (request.getColorIndex() != null) {
            // 색상 중복 체크 및 유효성 검사를 통한 안전한 색상 할당
            int validColorIndex = colorManager.getValidColorIndexForUser(userId, request.getColorIndex());
            calendar.setColorIndex(validColorIndex);
            
            log.info("🎨 [COLOR_ASSIGN] 캘린더 색상 할당: calendarId={}, requested={}, assigned={}", 
                    calendarId, request.getColorIndex(), validColorIndex);
        }
        if (request.getIsActive() != null) {
            calendar.setIsActive(request.getIsActive());
        }
        if (request.getSortOrder() != null) {
            calendar.setSortOrder(request.getSortOrder());
        }
        
        // updatedAt은 DB에서 자동 관리 (ON UPDATE current_timestamp())

        UserCalendar savedCalendar = userCalendarRepository.save(calendar);
        return convertToResponse(savedCalendar);
    }

    /**
     * 캘린더 삭제
     */
    @Transactional
    public void deleteCalendar(UUID calendarId, UUID userId) {
        UserCalendar calendar = userCalendarRepository.findById(calendarId)
                .orElseThrow(() -> ErrorStatus.CALENDAR_NOT_FOUND.asServiceException());

        // 권한 체크
        if (!calendar.getUser().getId().equals(userId)) {
            throw ErrorStatus.CALENDAR_ACCESS_DENIED.asServiceException();
        }

        userCalendarRepository.delete(calendar);
    }

    /**
     * 개별 캘린더 동기화 (최적화: 해당 캘린더만 동기화)
     */
    @Transactional
    public CalendarResponse syncCalendar(UUID calendarId, UUID userId) {
        log.info("📅 [INDIVIDUAL_SYNC] Starting individual calendar sync: calendarId={}", calendarId);

        UserCalendar calendar = userCalendarRepository.findById(calendarId)
                .orElseThrow(ErrorStatus.CALENDAR_NOT_FOUND::asServiceException);

        // 권한 체크
        if (!calendar.getUser().getId().equals(userId)) {
            throw ErrorStatus.CALENDAR_ACCESS_DENIED.asServiceException();
        }

        // 활성화되지 않은 캘린더는 동기화하지 않음
//        if (!calendar.getIsActive()) {
//            log.warn("⚠️ [INDIVIDUAL_SYNC] Calendar is inactive, skipping sync: calendarId={}", calendarId);
//            return convertToResponse(calendar);
//        }

        log.info("🔄 [INDIVIDUAL_SYNC] Syncing single calendar: {} ({})", 
                calendar.getDisplayName(), calendar.getCalendarName());
        
        // 개별 캘린더만 동기화 실행 (단일 트랜잭션)
        log.info("🔄 [MAIN_SYNC] 메인 동기화 시작: {}", LocalDateTime.now());
        
        syncSingleCalendarWithTransaction(calendar);
        
        log.info("🔄 [MAIN_SYNC] 메인 동기화 완료: {}", LocalDateTime.now());
        
        // 단일 트랜잭션이므로 calendar 객체가 이미 최신 상태
        log.info("✅ [INDIVIDUAL_SYNC] Individual sync completed: calendarId={}, status={}, lastSyncedAt={}", 
                calendarId, calendar.getSyncStatus(), calendar.getLastSyncedAt());
        
        CalendarResponse response = convertToResponse(calendar);
        log.info("📤 [API_RESPONSE] 응답 생성 완료: lastSyncedAt={}", response.getLastSyncedAt());
        
        return response;
    }

    /**
     * 전체 캘린더 동기화 후 목록 반환
     */
    @Transactional
    public List<CalendarResponse> syncAllCalendarsAndGet(UUID userId) {
        log.info("🔄 [SYNC_AND_GET] 전체 캘린더 동기화 및 목록 조회 시작: userId={}", userId);
        
        // 1. 전체 캘린더 동기화 실행
        syncAllUserCalendars(userId);
        
        log.info("✅ [SYNC_AND_GET] 동기화 완료, 별도 트랜잭션에서 최신 목록 조회");
        
        // 2. 별도 트랜잭션에서 최신 데이터 조회 (JPA 1차 캐시 격리)
        return getUserCalendarsInNewTransaction(userId, false);
    }

    /**
     * 색상 팔레트 조회
     */
    public CalendarColorManager.ColorInfo[] getColorPalette() {
        return colorManager.getAllColors();
    }

    /**
     * 캘린더 상태 변경 (활성화/비활성화)
     */
    @Transactional
    public CalendarResponse toggleCalendarStatus(UUID calendarId, Boolean isActive, UUID userId) {
        log.info("🔄 [TOGGLE_STATUS] 캘린더 상태 변경: calendarId={}, isActive={}, userId={}", 
                calendarId, isActive, userId);

        UserCalendar calendar = userCalendarRepository.findById(calendarId)
                .filter(cal -> cal.getUser().getId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("캘린더를 찾을 수 없습니다: " + calendarId));

        calendar.setIsActive(isActive);
        // updatedAt은 DB에서 자동 관리 (ON UPDATE current_timestamp())

        UserCalendar savedCalendar = userCalendarRepository.save(calendar);

        log.info("✅ [TOGGLE_STATUS] 캘린더 상태 변경 완료: calendarId={}, newStatus={}", 
                calendarId, isActive);

        return convertToResponse(savedCalendar);
    }

    /**
     * 캘린더 순서 변경
     */
    @Transactional
    public List<CalendarResponse> updateCalendarOrder(List<Map<String, Object>> calendars, UUID userId) {
        log.info("🔄 [REORDER] 캘린더 순서 변경: userId={}, count={}", userId, calendars.size());

        List<CalendarResponse> updatedCalendars = new ArrayList<>();

        for (Map<String, Object> calendarData : calendars) {
            String calendarIdStr = (String) calendarData.get("id");
            Integer sortOrder = (Integer) calendarData.get("sortOrder");

            if (calendarIdStr == null || sortOrder == null) {
                throw new IllegalArgumentException("캘린더 ID와 정렬 순서는 필수입니다");
            }

            UUID calendarId = UUID.fromString(calendarIdStr);
            UserCalendar calendar = userCalendarRepository.findById(calendarId)
                    .filter(cal -> cal.getUser().getId().equals(userId))
                    .orElseThrow(() -> new IllegalArgumentException("캘린더를 찾을 수 없습니다: " + calendarId));

            calendar.setSortOrder(sortOrder);
            // updatedAt은 DB에서 자동 관리 (ON UPDATE current_timestamp())

            UserCalendar savedCalendar = userCalendarRepository.save(calendar);
            updatedCalendars.add(convertToResponse(savedCalendar));

            log.debug("🔄 [REORDER] 캘린더 순서 업데이트: calendarId={}, sortOrder={}", 
                    calendarId, sortOrder);
        }

        log.info("✅ [REORDER] 캘린더 순서 변경 완료: userId={}, updatedCount={}", 
                userId, updatedCalendars.size());

        return updatedCalendars;
    }

    /**
     * UserCalendar -> CalendarResponse 변환
     */
    private CalendarResponse convertToResponse(UserCalendar calendar) {
        return CalendarResponse.builder()
                .id(calendar.getId())
                .icalUrl(calendar.getIcalUrl())
                .calendarName(calendar.getCalendarName())
                .displayName(calendar.getDisplayName())
                .colorIndex(calendar.getColorIndex())
                .colorHex(colorManager.getColorByIndex(calendar.getColorIndex()))
                .colorName(colorManager.getColorNameByIndex(calendar.getColorIndex()))
                .syncStatus(calendar.getSyncStatus())
                .syncErrorMessage(calendar.getSyncErrorMessage())
                .isActive(calendar.getIsActive())
                .sortOrder(calendar.getSortOrder())
                .lastSyncedAt(calendar.getLastSyncedAt())
                .createdAt(calendar.getCreatedAt())
                .updatedAt(calendar.getUpdatedAt())
                .build();
    }

    /**
     * 캘린더 이벤트 DTO
     */
    @lombok.Builder
    @lombok.Getter
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CalendarEvent {
        private String id;
        private String title;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Boolean allDay;
        private String source;
        private String calendarId;
        private String calendarName;
        private String colorHex;
    }
}