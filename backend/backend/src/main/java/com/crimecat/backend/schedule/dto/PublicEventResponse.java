package com.crimecat.backend.schedule.dto;

import com.crimecat.backend.schedule.domain.Event;
import com.crimecat.backend.schedule.domain.EventStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 퍼블릭 API용 일정 응답 DTO
 * - 민감한 개인정보 제외
 * - 비로그인 사용자에게 안전하게 노출 가능한 정보만 포함
 */
@Getter
public class PublicEventResponse {
    private final UUID id;
    private final String title;
    private final String description;
    private final String category;
    private final EventStatus status;
    private final Integer maxParticipants;
    private final LocalDateTime scheduledAt;
    private final LocalDateTime createdAt;
    private final String creatorNickname; // 개인 식별 정보 제외한 닉네임만

    @Builder
    public PublicEventResponse(UUID id, String title, String description, String category, 
                              EventStatus status, Integer maxParticipants, LocalDateTime scheduledAt, 
                              LocalDateTime createdAt, String creatorNickname) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.status = status;
        this.maxParticipants = maxParticipants;
        this.scheduledAt = scheduledAt;
        this.createdAt = createdAt;
        this.creatorNickname = creatorNickname;
    }

    /**
     * Event 엔티티로부터 퍼블릭 응답 DTO 생성
     * - 개인정보 보호를 위해 최소한의 정보만 포함
     * - 생성자의 개인 식별 정보는 제외하고 닉네임만 포함
     */
    public static PublicEventResponse from(Event event) {
        // 상태 동적 처리: 완료된 일정인지 확인
        EventStatus displayStatus = event.getStatus();
        if (event.getStatus() == EventStatus.RECRUITMENT_COMPLETE && 
            event.getScheduledAt() != null && 
            event.getScheduledAt().isBefore(LocalDateTime.now())) {
            displayStatus = EventStatus.COMPLETED;
        }

        return PublicEventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .category(event.getCategory())
                .status(displayStatus)
                .maxParticipants(event.getMaxParticipants())
                .scheduledAt(event.getScheduledAt())
                .createdAt(event.getCreatedAt())
                .creatorNickname(event.getCreator().getNickname()) // 닉네임만 노출
                .build();
    }

    /**
     * 기존 EventResponse를 PublicEventResponse로 변환
     * - 기존 서비스 메서드 재활용을 위한 변환 메서드
     */
    public static PublicEventResponse fromEventResponse(EventResponse eventResponse) {
        return PublicEventResponse.builder()
                .id(eventResponse.getId())
                .title(eventResponse.getTitle())
                .description(eventResponse.getDescription())
                .category(eventResponse.getCategory())
                .status(eventResponse.getStatus())
                .maxParticipants(eventResponse.getMaxParticipants())
                .scheduledAt(eventResponse.getScheduledAt())
                .createdAt(null) // EventResponse에 createdAt이 없으므로 null
                .creatorNickname(eventResponse.getCreatorName())
                .build();
    }
}