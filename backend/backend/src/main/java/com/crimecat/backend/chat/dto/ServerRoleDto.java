package com.crimecat.backend.chat.dto;

import com.crimecat.backend.chat.domain.ServerRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServerRoleDto {

    private UUID id;
    private UUID serverId;
    private String name;
    private String color;
    private List<String> permissions;
    private UUID createdBy;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Factory method
    public static ServerRoleDto from(ServerRole serverRole) {
        return ServerRoleDto.builder()
                .id(serverRole.getId())
                .serverId(serverRole.getServer().getId())
                .name(serverRole.getName())
                .color(serverRole.getColor())
                .permissions(serverRole.getPermissions())
                .createdBy(serverRole.getCreatedBy())
                .isActive(serverRole.getIsActive())
                .createdAt(serverRole.getCreatedAt())
                .updatedAt(serverRole.getUpdatedAt())
                .build();
    }

    // Request DTOs
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String name;
        private String color;
        private List<String> permissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String name;
        private String color;
        private List<String> permissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignRequest {
        private List<UUID> roleIds;
    }

    // Response DTOs
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListResponse {
        private List<ServerRoleDto> roles;
        private long totalCount;
    }
}