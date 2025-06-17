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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "server_members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ServerMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "server_id", nullable = false)
    private ChatServer server;

    @Column(name = "user_id", nullable = false, columnDefinition = "BINARY(16)")
    @JdbcTypeCode(SqlTypes.BINARY)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private ServerRole role = ServerRole.MEMBER;

    @Column(name = "display_name", length = 50)
    private String displayName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "assigned_roles", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<Long> assignedRoles;

    @CreatedDate
    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @LastModifiedDate
    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Builder
    public ServerMember(ChatServer server, UUID userId, ServerRole role, String displayName, String avatarUrl, List<Long> assignedRoles) {
        this.server = server;
        this.userId = userId;
        this.role = role != null ? role : ServerRole.MEMBER;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.assignedRoles = assignedRoles;
        this.isActive = true;
    }

    public enum ServerRole {
        MEMBER,  // 기본 멤버 (하위 호환성을 위해 유지)
        ADMIN    // 서버 관리자 (하위 호환성을 위해 유지)
    }

    public void promoteToAdmin() {
        this.role = ServerRole.ADMIN;
    }

    public void demoteToMember() {
        this.role = ServerRole.MEMBER;
    }

    // 서버별 프로필 관리
    public void updateProfile(String displayName, String avatarUrl) {
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
    }

    public String getEffectiveDisplayName(String defaultUsername) {
        return displayName != null && !displayName.trim().isEmpty() ? displayName : defaultUsername;
    }

    public String getEffectiveAvatarUrl(String defaultAvatarUrl) {
        return avatarUrl != null && !avatarUrl.trim().isEmpty() ? avatarUrl : defaultAvatarUrl;
    }

    // 커스텀 역할 관리
    public void assignRoles(List<Long> roleIds) {
        this.assignedRoles = roleIds != null ? new ArrayList<>(roleIds) : new ArrayList<>();
    }

    public void addRole(Long roleId) {
        if (assignedRoles == null) {
            assignedRoles = new ArrayList<>();
        }
        if (!assignedRoles.contains(roleId)) {
            assignedRoles.add(roleId);
        }
    }

    public void removeRole(Long roleId) {
        if (assignedRoles != null) {
            assignedRoles.remove(roleId);
        }
    }

    public boolean hasRole(Long roleId) {
        return assignedRoles != null && assignedRoles.contains(roleId);
    }

    public List<Long> getAssignedRoles() {
        return assignedRoles != null ? new ArrayList<>(assignedRoles) : new ArrayList<>();
    }

    public void softDelete() {
        this.isActive = false;
    }

    public void restore() {
        this.isActive = true;
    }

    public boolean isAdmin() {
        return role == ServerRole.ADMIN;
    }

    public boolean isMember() {
        return role == ServerRole.MEMBER;
    }

    public void updateActivity() {
        this.lastActivityAt = LocalDateTime.now();
    }
}