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

    @CreatedDate
    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @LastModifiedDate
    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Builder
    public ServerMember(ChatServer server, UUID userId, ServerRole role) {
        this.server = server;
        this.userId = userId;
        this.role = role != null ? role : ServerRole.MEMBER;
        this.isActive = true;
    }

    public enum ServerRole {
        MEMBER,  // 기본 멤버
        ADMIN    // 서버 관리자 (서버 생성자가 위임 가능)
    }

    public void promoteToAdmin() {
        this.role = ServerRole.ADMIN;
    }

    public void demoteToMember() {
        this.role = ServerRole.MEMBER;
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