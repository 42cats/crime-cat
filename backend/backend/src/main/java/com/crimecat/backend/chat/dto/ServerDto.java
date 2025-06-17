package com.crimecat.backend.chat.dto;

import com.crimecat.backend.chat.domain.ChatServer;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.UUID;

public class ServerDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "서버 이름은 필수입니다")
        @Size(min = 1, max = 100, message = "서버 이름은 1-100자 사이여야 합니다")
        private String name;

        @Size(max = 500, message = "서버 설명은 500자 이하여야 합니다")
        private String description;

        @Size(min = 4, max = 50, message = "비밀번호는 4-50자 사이여야 합니다")
        private String password;

        @Min(value = 1, message = "최대 멤버 수는 1명 이상이어야 합니다")
        @Max(value = 1000, message = "최대 멤버 수는 1000명 이하여야 합니다")
        private Integer maxMembers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @Size(min = 1, max = 100, message = "서버 이름은 1-100자 사이여야 합니다")
        private String name;

        @Size(max = 500, message = "서버 설명은 500자 이하여야 합니다")
        private String description;

        @Size(min = 4, max = 50, message = "비밀번호는 4-50자 사이여야 합니다")
        private String password;

        @Min(value = 1, message = "최대 멤버 수는 1명 이상이어야 합니다")
        @Max(value = 1000, message = "최대 멤버 수는 1000명 이하여야 합니다")
        private Integer maxMembers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JoinRequest {
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String name;
        private String description;
        private boolean hasPassword;
        private Integer maxMembers;
        private Integer currentMembers;
        private UUID createdBy;
        
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime createdAt;
        
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime updatedAt;
    }

    public static Response from(ChatServer server) {
        return Response.builder()
                .id(server.getId())
                .name(server.getName())
                .description(server.getDescription())
                .hasPassword(server.getPasswordHash() != null)
                .maxMembers(server.getMaxMembers())
                .currentMembers(0) // TODO: 실제 멤버 수 계산
                .createdBy(server.getCreatedBy())
                .createdAt(server.getCreatedAt())
                .updatedAt(server.getUpdatedAt())
                .build();
    }
}