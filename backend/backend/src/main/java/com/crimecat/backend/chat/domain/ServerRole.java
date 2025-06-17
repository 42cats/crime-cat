package com.crimecat.backend.chat.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "server_roles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ServerRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "server_id", nullable = false)
    private ChatServer server;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "color", length = 7)
    private String color = "#ffffff";

    @Column(name = "permissions", nullable = false, columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> permissions;

    @Column(name = "created_by", nullable = false, columnDefinition = "BINARY(16)")
    @JdbcTypeCode(SqlTypes.BINARY)
    private UUID createdBy;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public ServerRole(ChatServer server, String name, String color, List<String> permissions, UUID createdBy) {
        this.server = server;
        this.name = name;
        this.color = color != null ? color : "#ffffff";
        this.permissions = permissions;
        this.createdBy = createdBy;
        this.isActive = true;
    }

    // 권한 관련 메서드
    public boolean hasPermission(String permission) {
        return permissions != null && permissions.contains(permission);
    }

    public boolean hasAnyPermission(List<String> requiredPermissions) {
        if (permissions == null || requiredPermissions == null) {
            return false;
        }
        return requiredPermissions.stream().anyMatch(permissions::contains);
    }

    public boolean hasAllPermissions(List<String> requiredPermissions) {
        if (permissions == null || requiredPermissions == null) {
            return false;
        }
        return permissions.containsAll(requiredPermissions);
    }

    // 업데이트 메서드
    public void updateInfo(String name, String color, List<String> permissions) {
        if (name != null && !name.trim().isEmpty()) {
            this.name = name;
        }
        if (color != null && color.matches("^#[0-9A-Fa-f]{6}$")) {
            this.color = color;
        }
        if (permissions != null) {
            this.permissions = permissions;
        }
    }

    public void softDelete() {
        this.isActive = false;
    }

    public void restore() {
        this.isActive = true;
    }

    // 기본 권한 상수
    public static class Permissions {
        public static final String CAN_MANAGE_SERVER = "canManageServer";
        public static final String CAN_MANAGE_CHANNELS = "canManageChannels";
        public static final String CAN_MANAGE_ROLES = "canManageRoles";
        public static final String CAN_KICK_MEMBERS = "canKickMembers";
        public static final String CAN_BAN_MEMBERS = "canBanMembers";
        public static final String CAN_SEND_MESSAGES = "canSendMessages";
        public static final String CAN_USE_VOICE = "canUseVoice";
        public static final String CAN_MUTE_MEMBERS = "canMuteMembers";
        public static final String CAN_DEAFEN_MEMBERS = "canDeafenMembers";
        public static final String CAN_MOVE_MEMBERS = "canMoveMembers";
        public static final String CAN_CREATE_INVITES = "canCreateInvites";
        public static final String CAN_MANAGE_NICKNAMES = "canManageNicknames";
        public static final String CAN_VIEW_AUDIT_LOG = "canViewAuditLog";
        
        // 관리자 권한 목록
        public static final List<String> ADMIN_PERMISSIONS = List.of(
            CAN_MANAGE_SERVER, CAN_MANAGE_CHANNELS, CAN_MANAGE_ROLES, 
            CAN_KICK_MEMBERS, CAN_BAN_MEMBERS, CAN_SEND_MESSAGES, 
            CAN_USE_VOICE, CAN_MUTE_MEMBERS, CAN_DEAFEN_MEMBERS, 
            CAN_MOVE_MEMBERS, CAN_CREATE_INVITES, CAN_MANAGE_NICKNAMES, 
            CAN_VIEW_AUDIT_LOG
        );
        
        // 기본 멤버 권한 목록
        public static final List<String> MEMBER_PERMISSIONS = List.of(
            CAN_SEND_MESSAGES, CAN_USE_VOICE, CAN_CREATE_INVITES
        );
    }

    // 역할 유형 체크
    public boolean isAdminRole() {
        return hasPermission(Permissions.CAN_MANAGE_SERVER);
    }

    public boolean isModeratorRole() {
        return hasAnyPermission(List.of(
            Permissions.CAN_MANAGE_CHANNELS, 
            Permissions.CAN_KICK_MEMBERS, 
            Permissions.CAN_MUTE_MEMBERS
        ));
    }
}