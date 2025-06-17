package com.crimecat.backend.chat.dto;

import com.crimecat.backend.chat.domain.ServerChannel;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.UUID;

public class ChannelDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "채널 이름은 필수입니다")
        @Size(min = 1, max = 100, message = "채널 이름은 1-100자 사이여야 합니다")
        private String name;

        @Size(max = 500, message = "채널 설명은 500자 이하여야 합니다")
        private String description;

        @NotBlank(message = "채널 타입은 필수입니다")
        private String type; // TEXT, VOICE, BOTH
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @Size(min = 1, max = 100, message = "채널 이름은 1-100자 사이여야 합니다")
        private String name;

        @Size(max = 500, message = "채널 설명은 500자 이하여야 합니다")
        private String description;

        private String type; // TEXT, VOICE, BOTH
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long serverId;
        private String name;
        private String description;
        private String type;
        private Integer memberCount;
        private UUID createdBy;
        
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime createdAt;
        
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime updatedAt;
    }

    public static Response from(ServerChannel channel) {
        return Response.builder()
                .id(channel.getId())
                .serverId(channel.getServer().getId())
                .name(channel.getName())
                .description(channel.getDescription())
                .type(channel.getChannelType().name())
                .memberCount(0) // TODO: 실제 멤버 수 계산
                .createdBy(channel.getCreatedBy())
                .createdAt(channel.getCreatedAt())
                .updatedAt(channel.getUpdatedAt())
                .build();
    }
}