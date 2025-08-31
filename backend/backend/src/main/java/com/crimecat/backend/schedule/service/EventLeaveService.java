package com.crimecat.backend.schedule.service;

import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.schedule.domain.Event;
import com.crimecat.backend.schedule.domain.EventParticipant;
import com.crimecat.backend.schedule.domain.EventStatus;
import com.crimecat.backend.schedule.domain.EventType;
import com.crimecat.backend.schedule.repository.EventParticipantRepository;
import com.crimecat.backend.schedule.repository.EventRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 이벤트 나가기 및 동적 상태 관리 서비스
 * - 참여자가 이벤트를 떠날 때 처리
 * - 최소 인원 미달 시 자동 상태 변경
 * - 확정된 이벤트의 모집 재개 기능
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class EventLeaveService {

    private final EventRepository eventRepository;
    private final EventParticipantRepository eventParticipantRepository;
    private final EventStatusService eventStatusService;

    /**
     * 이벤트 나가기 처리
     * - 참여자의 leftAt 시간 설정
     * - 동적 상태 업데이트 트리거
     * - 캐시 무효화
     */
    @Caching(evict = {
        @CacheEvict(value = CacheType.SCHEDULE_EVENT_LIST, allEntries = true),
        @CacheEvict(value = CacheType.SCHEDULE_EVENT_DETAIL, key = "#eventId.toString()"),
        @CacheEvict(value = CacheType.SCHEDULE_PARTICIPANTS, allEntries = true),
        @CacheEvict(value = CacheType.SCHEDULE_AVAILABILITY, allEntries = true),
        @CacheEvict(value = CacheType.SCHEDULE_RECOMMENDED_TIMES, allEntries = true)
    })
    public LeaveResult leaveEvent(UUID eventId, UUID userId) {
        log.info("User {} attempting to leave event {}", userId, eventId);
        
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> ErrorStatus.EVENT_NOT_FOUND.asServiceException());
        
        WebUser user = WebUser.builder().id(userId).build(); // 프록시 객체
        
        // 활성 참여 기록 조회
        EventParticipant participation = eventParticipantRepository.findByEventAndUser(event, user)
            .orElseThrow(() -> ErrorStatus.EVENT_NOT_PARTICIPANT.asServiceException());
        
        if (participation.getLeftAt() != null) {
            log.warn("User {} already left event {} at {}", userId, eventId, participation.getLeftAt());
            throw ErrorStatus.EVENT_ALREADY_LEFT.asServiceException();
        }
        
        // 이벤트 생성자는 나갈 수 없음
        if (event.getCreator().getId().equals(userId)) {
            log.warn("Event creator {} cannot leave their own event {}", userId, eventId);
            throw ErrorStatus.EVENT_CREATOR_CANNOT_LEAVE.asServiceException();
        }
        
        // 나가기 처리
        participation.setLeftAt(LocalDateTime.now());
        eventParticipantRepository.save(participation);
        
        // 남은 활성 참여자 수 계산
        int activeParticipantCount = eventParticipantRepository.countActiveByEvent(event);
        
        log.info("User {} left event {}. Active participants: {}/{}", 
                userId, eventId, activeParticipantCount, event.getMinParticipants());
        
        // 동적 상태 업데이트
        EventStatus previousStatus = event.getStatus();
        EventStatus newStatus = eventStatusService.updateEventStatusAfterLeave(event, activeParticipantCount);
        
        String message = generateLeaveMessage(event, activeParticipantCount, previousStatus, newStatus);
        
        return LeaveResult.builder()
            .success(true)
            .message(message)
            .previousStatus(previousStatus)
            .currentStatus(newStatus)
            .activeParticipants(activeParticipantCount)
            .minParticipants(event.getMinParticipants())
            .statusChanged(!previousStatus.equals(newStatus))
            .build();
    }

    /**
     * 이벤트 재참여 처리 (나갔던 사용자가 다시 참여)
     */
    @Caching(evict = {
        @CacheEvict(value = CacheType.SCHEDULE_EVENT_LIST, allEntries = true),
        @CacheEvict(value = CacheType.SCHEDULE_EVENT_DETAIL, key = "#eventId.toString()"),
        @CacheEvict(value = CacheType.SCHEDULE_PARTICIPANTS, allEntries = true),
        @CacheEvict(value = CacheType.SCHEDULE_AVAILABILITY, allEntries = true),
        @CacheEvict(value = CacheType.SCHEDULE_RECOMMENDED_TIMES, allEntries = true)
    })
    public RejoinResult rejoinEvent(UUID eventId, UUID userId) {
        log.info("User {} attempting to rejoin event {}", userId, eventId);
        
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> ErrorStatus.EVENT_NOT_FOUND.asServiceException());
        
        WebUser user = WebUser.builder().id(userId).build();
        
        // 기존 참여 기록 조회
        EventParticipant participation = eventParticipantRepository.findByEventAndUser(event, user)
            .orElseThrow(() -> ErrorStatus.EVENT_NOT_PARTICIPANT.asServiceException());
        
        if (participation.getLeftAt() == null) {
            throw ErrorStatus.EVENT_ALREADY_JOINED.asServiceException();
        }
        
        // 이벤트가 모집 중이 아닌 경우 재참여 불가
        if (event.getStatus() != EventStatus.RECRUITING) {
            throw ErrorStatus.EVENT_NOT_RECRUITING.asServiceException();
        }
        
        // 최대 인원 확인
        if (event.getMaxParticipants() != null) {
            int currentActiveCount = eventParticipantRepository.countActiveByEvent(event);
            if (currentActiveCount >= event.getMaxParticipants()) {
                throw ErrorStatus.EVENT_FULL.asServiceException();
            }
        }
        
        // 재참여 처리
        participation.setLeftAt(null); // leftAt 초기화
        eventParticipantRepository.save(participation);
        
        // 활성 참여자 수 재계산
        int activeParticipantCount = eventParticipantRepository.countActiveByEvent(event);
        
        log.info("User {} rejoined event {}. Active participants: {}/{}", 
                userId, eventId, activeParticipantCount, event.getMinParticipants());
        
        // 동적 상태 업데이트
        EventStatus previousStatus = event.getStatus();
        EventStatus newStatus = eventStatusService.updateEventStatusAfterJoin(event, activeParticipantCount);
        
        return RejoinResult.builder()
            .success(true)
            .message("이벤트에 다시 참여했습니다.")
            .previousStatus(previousStatus)
            .currentStatus(newStatus)
            .activeParticipants(activeParticipantCount)
            .statusChanged(!previousStatus.equals(newStatus))
            .build();
    }

    /**
     * 이벤트 참여자들의 나가기 기록 조회
     */
    @Transactional(readOnly = true)
    public List<EventParticipant> getEventLeavers(UUID eventId) {
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> ErrorStatus.EVENT_NOT_FOUND.asServiceException());
        
        return eventParticipantRepository.findByEvent(event).stream()
            .filter(ep -> ep.getLeftAt() != null)
            .toList();
    }

    /**
     * 나가기 메시지 생성
     */
    private String generateLeaveMessage(Event event, int activeParticipants, 
                                      EventStatus previousStatus, EventStatus newStatus) {
        StringBuilder message = new StringBuilder("이벤트에서 나왔습니다.");
        
        // 상태 변경 안내
        if (!previousStatus.equals(newStatus)) {
            String statusMessage = switch (newStatus) {
                case RECRUITING -> " 최소 인원 미달로 모집이 다시 시작됩니다.";
                case CANCELLED -> " 최소 인원 미달로 이벤트가 취소되었습니다.";
                default -> String.format(" 이벤트 상태가 %s로 변경되었습니다.", newStatus);
            };
            message.append(statusMessage);
        }
        
        // 인원 현황 안내
        if (event.getEventType() == EventType.FLEXIBLE) {
            message.append(String.format(" 현재 참여자: %d명 (최소 %d명 필요)", 
                    activeParticipants, event.getMinParticipants()));
        }
        
        return message.toString();
    }

    /**
     * 나가기 결과 DTO
     */
    public static class LeaveResult {
        private final boolean success;
        private final String message;
        private final EventStatus previousStatus;
        private final EventStatus currentStatus;
        private final Integer activeParticipants;
        private final Integer minParticipants;
        private final boolean statusChanged;

        private LeaveResult(LeaveResultBuilder builder) {
            this.success = builder.success;
            this.message = builder.message;
            this.previousStatus = builder.previousStatus;
            this.currentStatus = builder.currentStatus;
            this.activeParticipants = builder.activeParticipants;
            this.minParticipants = builder.minParticipants;
            this.statusChanged = builder.statusChanged;
        }

        public static LeaveResultBuilder builder() {
            return new LeaveResultBuilder();
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public EventStatus getPreviousStatus() { return previousStatus; }
        public EventStatus getCurrentStatus() { return currentStatus; }
        public Integer getActiveParticipants() { return activeParticipants; }
        public Integer getMinParticipants() { return minParticipants; }
        public boolean isStatusChanged() { return statusChanged; }

        public static class LeaveResultBuilder {
            private boolean success;
            private String message;
            private EventStatus previousStatus;
            private EventStatus currentStatus;
            private Integer activeParticipants;
            private Integer minParticipants;
            private boolean statusChanged;

            public LeaveResultBuilder success(boolean success) {
                this.success = success;
                return this;
            }

            public LeaveResultBuilder message(String message) {
                this.message = message;
                return this;
            }

            public LeaveResultBuilder previousStatus(EventStatus previousStatus) {
                this.previousStatus = previousStatus;
                return this;
            }

            public LeaveResultBuilder currentStatus(EventStatus currentStatus) {
                this.currentStatus = currentStatus;
                return this;
            }

            public LeaveResultBuilder activeParticipants(Integer activeParticipants) {
                this.activeParticipants = activeParticipants;
                return this;
            }

            public LeaveResultBuilder minParticipants(Integer minParticipants) {
                this.minParticipants = minParticipants;
                return this;
            }

            public LeaveResultBuilder statusChanged(boolean statusChanged) {
                this.statusChanged = statusChanged;
                return this;
            }

            public LeaveResult build() {
                return new LeaveResult(this);
            }
        }
    }

    /**
     * 재참여 결과 DTO
     */
    public static class RejoinResult {
        private final boolean success;
        private final String message;
        private final EventStatus previousStatus;
        private final EventStatus currentStatus;
        private final Integer activeParticipants;
        private final boolean statusChanged;

        private RejoinResult(RejoinResultBuilder builder) {
            this.success = builder.success;
            this.message = builder.message;
            this.previousStatus = builder.previousStatus;
            this.currentStatus = builder.currentStatus;
            this.activeParticipants = builder.activeParticipants;
            this.statusChanged = builder.statusChanged;
        }

        public static RejoinResultBuilder builder() {
            return new RejoinResultBuilder();
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public EventStatus getPreviousStatus() { return previousStatus; }
        public EventStatus getCurrentStatus() { return currentStatus; }
        public Integer getActiveParticipants() { return activeParticipants; }
        public boolean isStatusChanged() { return statusChanged; }

        public static class RejoinResultBuilder {
            private boolean success;
            private String message;
            private EventStatus previousStatus;
            private EventStatus currentStatus;
            private Integer activeParticipants;
            private boolean statusChanged;

            public RejoinResultBuilder success(boolean success) {
                this.success = success;
                return this;
            }

            public RejoinResultBuilder message(String message) {
                this.message = message;
                return this;
            }

            public RejoinResultBuilder previousStatus(EventStatus previousStatus) {
                this.previousStatus = previousStatus;
                return this;
            }

            public RejoinResultBuilder currentStatus(EventStatus currentStatus) {
                this.currentStatus = currentStatus;
                return this;
            }

            public RejoinResultBuilder activeParticipants(Integer activeParticipants) {
                this.activeParticipants = activeParticipants;
                return this;
            }

            public RejoinResultBuilder statusChanged(boolean statusChanged) {
                this.statusChanged = statusChanged;
                return this;
            }

            public RejoinResult build() {
                return new RejoinResult(this);
            }
        }
    }
}