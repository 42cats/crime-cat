package com.crimecat.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class VoiceSessionDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StartRequest {
        @NotNull(message = "서버 ID는 필수입니다")
        private UUID serverId;
        
        @NotNull(message = "채널 ID는 필수입니다")
        private UUID channelId;
        
        @NotNull(message = "사용자 ID는 필수입니다")
        private UUID userId;
        
        private String username;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EndRequest {
        @NotNull(message = "서버 ID는 필수입니다")
        private UUID serverId;
        
        @NotNull(message = "채널 ID는 필수입니다")
        private UUID channelId;
        
        @NotNull(message = "사용자 ID는 필수입니다")
        private UUID userId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private UUID sessionId;
        private UUID serverId;
        private UUID channelId;
        private UUID userId;
        private String username;
        private LocalDateTime startedAt;
        private LocalDateTime endedAt;
        private Boolean isActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActiveSessionsResponse {
        private UUID serverId;
        private UUID channelId;
        private List<ActiveSession> activeSessions;
        private Integer totalCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActiveSession {
        private UUID userId;
        private String username;
        private LocalDateTime joinedAt;
    }
}