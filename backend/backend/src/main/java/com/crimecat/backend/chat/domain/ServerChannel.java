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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "server_channels")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ServerChannel {

    @Id
    @JdbcTypeCode(SqlTypes.BINARY)
    @UuidGenerator
    @Column(name = "id", columnDefinition = "BINARY(16)", updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "server_id", nullable = false)
    private ChatServer server;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel_type")
    private ChannelType channelType = ChannelType.TEXT;

    @Column(name = "created_by", nullable = false, columnDefinition = "BINARY(16)")
    @JdbcTypeCode(SqlTypes.BINARY)
    private UUID createdBy;

    @Column(name = "max_members")
    private Integer maxMembers = 50;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "channel", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChannelMember> members = new ArrayList<>();

    @OneToMany(mappedBy = "channel", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChatMessage> messages = new ArrayList<>();

    @Builder
    public ServerChannel(ChatServer server, String name, String description, ChannelType channelType, UUID createdBy, Integer maxMembers) {
        this.server = server;
        this.name = name;
        this.description = description;
        this.channelType = channelType != null ? channelType : ChannelType.TEXT;
        this.createdBy = createdBy;
        this.maxMembers = maxMembers != null ? maxMembers : 50;
        this.isActive = true;
    }

    public enum ChannelType {
        TEXT,   // 텍스트 전용 (Discord 스타일)
        VOICE   // 음성 전용 (Discord 스타일)
    }

    public boolean isOwner(UUID userId) {
        return createdBy.equals(userId);
    }

    public void softDelete() {
        this.isActive = false;
        this.deletedAt = LocalDateTime.now();
    }

    public void restore() {
        this.isActive = true;
        this.deletedAt = null;
    }

    public void updateInfo(String name, String description, ChannelType channelType, Integer maxMembers) {
        if (name != null && !name.trim().isEmpty()) {
            this.name = name;
        }
        if (description != null) {
            this.description = description;
        }
        if (channelType != null) {
            this.channelType = channelType;
        }
        if (maxMembers != null && maxMembers > 0) {
            this.maxMembers = maxMembers;
        }
    }

    public long getActiveMemberCount() {
        return members.stream()
                .filter(member -> member.getIsActive())
                .count();
    }

    public boolean isFull() {
        return getActiveMemberCount() >= maxMembers;
    }

    public boolean hasMember(UUID userId) {
        return members.stream()
                .anyMatch(member -> member.getUserId().equals(userId) && member.getIsActive());
    }

    public boolean isModerator(UUID userId) {
        return members.stream()
                .anyMatch(member -> member.getUserId().equals(userId) 
                        && member.getIsActive() 
                        && member.getRole() == ChannelMember.ChannelRole.MODERATOR);
    }

    public boolean canUserAccess(UUID userId) {
        // 서버 멤버이면서 채널 멤버인 경우 접근 가능
        return server.hasMember(userId) && hasMember(userId);
    }

    public boolean canUserModerate(UUID userId) {
        // 서버 관리자이거나 채널 모더레이터인 경우 관리 가능
        return server.isAdmin(userId) || isModerator(userId);
    }
}