package com.crimecat.backend.schedule.service;

import com.crimecat.backend.schedule.domain.Event;
import com.crimecat.backend.schedule.domain.EventStatus;
import com.crimecat.backend.schedule.domain.EventType;
import com.crimecat.backend.schedule.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 이벤트 상태 관리 서비스
 * - 참여자 변화에 따른 동적 상태 업데이트
 * - 이벤트 라이프사이클 관리
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class EventStatusService {

    private final EventRepository eventRepository;

    /**
     * 참여자가 나간 후 이벤트 상태 업데이트
     */
    public EventStatus updateEventStatusAfterLeave(Event event, int activeParticipantCount) {
        EventStatus currentStatus = event.getStatus();
        EventStatus newStatus = determineNewStatusAfterLeave(event, activeParticipantCount, currentStatus);
        
        if (!currentStatus.equals(newStatus)) {
            event.setStatus(newStatus);
            eventRepository.save(event);
            log.info("Event {} status changed from {} to {} after participant left. Active participants: {}",
                    event.getId(), currentStatus, newStatus, activeParticipantCount);
        }
        
        return newStatus;
    }

    /**
     * 참여자가 들어온 후 이벤트 상태 업데이트
     */
    public EventStatus updateEventStatusAfterJoin(Event event, int activeParticipantCount) {
        EventStatus currentStatus = event.getStatus();
        EventStatus newStatus = determineNewStatusAfterJoin(event, activeParticipantCount, currentStatus);
        
        if (!currentStatus.equals(newStatus)) {
            event.setStatus(newStatus);
            eventRepository.save(event);
            log.info("Event {} status changed from {} to {} after participant joined. Active participants: {}",
                    event.getId(), currentStatus, newStatus, activeParticipantCount);
        }
        
        return newStatus;
    }

    /**
     * 참여자가 나간 후 새 상태 결정
     */
    private EventStatus determineNewStatusAfterLeave(Event event, int activeParticipantCount, EventStatus currentStatus) {
        // FIXED 이벤트는 상태 변화 없음
        if (event.getEventType() == EventType.FIXED) {
            return currentStatus;
        }
        
        // FLEXIBLE 이벤트 상태 로직
        switch (currentStatus) {
            case RECRUITING:
                // 이미 모집 중이면 변화 없음
                return EventStatus.RECRUITING;
                
            case RECRUITMENT_COMPLETE:
                // 모집 완료 상태에서 최소 인원 미달이면 다시 모집으로 변경
                if (activeParticipantCount < event.getMinParticipants()) {
                    return EventStatus.RECRUITING;
                }
                return EventStatus.RECRUITMENT_COMPLETE;
                
            case COMPLETED:
                // 완료된 이벤트는 상태 변화 없음
                return EventStatus.COMPLETED;
                
            case CANCELLED:
                // 취소된 이벤트는 상태 변화 없음
                return EventStatus.CANCELLED;
                
            default:
                return currentStatus;
        }
    }

    /**
     * 참여자가 들어온 후 새 상태 결정
     */
    private EventStatus determineNewStatusAfterJoin(Event event, int activeParticipantCount, EventStatus currentStatus) {
        // FIXED 이벤트는 상태 변화 없음
        if (event.getEventType() == EventType.FIXED) {
            return currentStatus;
        }
        
        // FLEXIBLE 이벤트 상태 로직
        switch (currentStatus) {
            case RECRUITING:
                // 최소 인원을 충족하면 모집 완료로 변경
                if (activeParticipantCount >= event.getMinParticipants()) {
                    return EventStatus.RECRUITMENT_COMPLETE;
                }
                return EventStatus.RECRUITING;
                
            case RECRUITMENT_COMPLETE:
                // 이미 모집 완료면 변화 없음
                return EventStatus.RECRUITMENT_COMPLETE;
                
            case COMPLETED:
                // 완료된 이벤트는 상태 변화 없음
                return EventStatus.COMPLETED;
                
            case CANCELLED:
                // 취소된 이벤트에 참여자가 들어오면 다시 모집으로 변경
                if (activeParticipantCount >= event.getMinParticipants()) {
                    return EventStatus.RECRUITMENT_COMPLETE;
                } else {
                    return EventStatus.RECRUITING;
                }
                
            default:
                return currentStatus;
        }
    }

    /**
     * 이벤트 수동 상태 변경 (관리자용)
     */
    public EventStatus changeEventStatus(Event event, EventStatus newStatus) {
        EventStatus previousStatus = event.getStatus();
        event.setStatus(newStatus);
        eventRepository.save(event);
        
        log.info("Event {} status manually changed from {} to {}",
                event.getId(), previousStatus, newStatus);
        
        return newStatus;
    }

    /**
     * 이벤트 완료 처리
     */
    public EventStatus completeEvent(Event event) {
        EventStatus previousStatus = event.getStatus();
        event.setStatus(EventStatus.COMPLETED);
        eventRepository.save(event);
        
        log.info("Event {} marked as completed (previous status: {})",
                event.getId(), previousStatus);
        
        return EventStatus.COMPLETED;
    }

    /**
     * 이벤트 취소 처리
     */
    public EventStatus cancelEvent(Event event, String reason) {
        EventStatus previousStatus = event.getStatus();
        event.setStatus(EventStatus.CANCELLED);
        eventRepository.save(event);
        
        log.info("Event {} cancelled (previous status: {}, reason: {})",
                event.getId(), previousStatus, reason);
        
        return EventStatus.CANCELLED;
    }
}