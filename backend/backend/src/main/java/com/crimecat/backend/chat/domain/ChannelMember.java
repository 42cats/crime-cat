package com.crimecat.backend.chat.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "channel_members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ChannelMember {

    @Id
    @JdbcTypeCode(SqlTypes.BINARY)
    @UuidGenerator
    @Column(name = "id", columnDefinition = "BINARY(16)", updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private ServerChannel channel;

    @Column(name = "user_id", nullable = false, columnDefinition = "BINARY(16)")
    @JdbcTypeCode(SqlTypes.BINARY)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private ChannelRole role = ChannelRole.MEMBER;

    @CreatedDate
    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @LastModifiedDate
    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Builder
    public ChannelMember(ServerChannel channel, UUID userId, ChannelRole role) {
        this.channel = channel;
        this.userId = userId;
        this.role = role != null ? role : ChannelRole.MEMBER;
        this.isActive = true;
    }

    public enum ChannelRole {
        MEMBER,     // 기본 멤버
        MODERATOR   // 채널 모더레이터 (서버 ADMIN이 위임 가능)
    }

    public void promoteToModerator() {
        this.role = ChannelRole.MODERATOR;
    }

    public void demoteToMember() {
        this.role = ChannelRole.MEMBER;
    }

    public void softDelete() {
        this.isActive = false;
    }

    public void restore() {
        this.isActive = true;
    }

    public boolean isModerator() {
        return role == ChannelRole.MODERATOR;
    }

    public boolean isMember() {
        return role == ChannelRole.MEMBER;
    }

    public void updateActivity() {
        this.lastActivityAt = LocalDateTime.now();
    }
}