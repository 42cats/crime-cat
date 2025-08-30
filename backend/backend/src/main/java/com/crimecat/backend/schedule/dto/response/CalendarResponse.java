package com.crimecat.backend.schedule.dto.response;

import com.crimecat.backend.schedule.domain.UserCalendar;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 캘린더 정보 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarResponse {
    private UUID id;
    private String icalUrl;
    private String calendarName;
    private String displayName;
    private Integer colorIndex;
    private String colorHex;
    private String colorName;
    private UserCalendar.SyncStatus syncStatus;
    private String syncErrorMessage;
    private Boolean isActive;
    private Integer sortOrder;
    private LocalDateTime lastSyncedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}