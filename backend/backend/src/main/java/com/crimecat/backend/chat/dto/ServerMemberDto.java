package com.crimecat.backend.chat.dto;

import com.crimecat.backend.chat.domain.ServerMember;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServerMemberDto {

    private Long id;
    private Long serverId;
    private String userId;
    private String role; // MEMBER, ADMIN (legacy)
    private String displayName;
    private String avatarUrl;
    private List<Long> assignedRoles;
    private String effectiveDisplayName;
    private String effectiveAvatarUrl;
    private LocalDateTime joinedAt;
    private LocalDateTime lastActivityAt;
    private Boolean isActive;

    // Factory method
    public static ServerMemberDto from(ServerMember serverMember, String defaultUsername, String defaultAvatarUrl) {
        return ServerMemberDto.builder()
                .id(serverMember.getId())
                .serverId(serverMember.getServer().getId())
                .userId(serverMember.getUserId().toString())
                .role(serverMember.getRole().name())
                .displayName(serverMember.getDisplayName())
                .avatarUrl(serverMember.getAvatarUrl())
                .assignedRoles(serverMember.getAssignedRoles())
                .effectiveDisplayName(serverMember.getEffectiveDisplayName(defaultUsername))
                .effectiveAvatarUrl(serverMember.getEffectiveAvatarUrl(defaultAvatarUrl))
                .joinedAt(serverMember.getJoinedAt())
                .lastActivityAt(serverMember.getLastActivityAt())
                .isActive(serverMember.getIsActive())
                .build();
    }

    // Request DTOs
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileUpdateRequest {
        private String displayName;
        private String avatarUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleAssignRequest {
        private List<Long> roleIds;
    }

    // Extended DTO with role details
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WithRoles {
        private Long id;
        private Long serverId;
        private String userId;
        private String role;
        private String displayName;
        private String avatarUrl;
        private List<Long> assignedRoles;
        private List<ServerRoleDto> roleDetails;
        private String effectiveDisplayName;
        private String effectiveAvatarUrl;
        private LocalDateTime joinedAt;
        private LocalDateTime lastActivityAt;
        private Boolean isActive;
    }

    // Response DTOs
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListResponse {
        private List<ServerMemberDto> members;
        private long totalCount;
    }
}