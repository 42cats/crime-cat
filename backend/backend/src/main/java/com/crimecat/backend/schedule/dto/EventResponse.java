package com.crimecat.backend.schedule.dto;

import com.crimecat.backend.schedule.domain.Event;
import com.crimecat.backend.schedule.domain.EventStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
public class EventResponse {
    private final UUID id;
    private final String title;
    private final String description;
    private final String category;
    private final EventStatus status;
    private final Integer maxParticipants;
    private final LocalDateTime scheduledAt;
    private final String creatorName; // Example of flattening data for response

    @Builder
    public EventResponse(UUID id, String title, String description, String category, EventStatus status, Integer maxParticipants, LocalDateTime scheduledAt, String creatorName) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.status = status;
        this.maxParticipants = maxParticipants;
        this.scheduledAt = scheduledAt;
        this.creatorName = creatorName;
    }

    public static EventResponse from(Event event) {
        // The logic for COMPLETED status will be handled here or in the service
        EventStatus displayStatus = event.getStatus();
        if (event.getStatus() == EventStatus.RECRUITMENT_COMPLETE && event.getScheduledAt() != null && event.getScheduledAt().isBefore(LocalDateTime.now())) {
            displayStatus = EventStatus.COMPLETED;
        }

        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .category(event.getCategory())
                .status(displayStatus)
                .maxParticipants(event.getMaxParticipants())
                .scheduledAt(event.getScheduledAt())
                .creatorName(event.getCreator().getNickname()) // Assuming User has a getNickname() method
                .build();
    }
}
