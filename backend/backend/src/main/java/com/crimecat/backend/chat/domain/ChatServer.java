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
@Table(name = "chat_servers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ChatServer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "created_by", nullable = false, columnDefinition = "BINARY(16)")
    @JdbcTypeCode(SqlTypes.BINARY)
    private UUID createdBy;

    @Column(name = "max_members")
    private Integer maxMembers = 100;

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

    @OneToMany(mappedBy = "server", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServerMember> members = new ArrayList<>();

    @OneToMany(mappedBy = "server", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServerChannel> channels = new ArrayList<>();

    @Builder
    public ChatServer(String name, String description, String passwordHash, UUID createdBy, Integer maxMembers) {
        this.name = name;
        this.description = description;
        this.passwordHash = passwordHash;
        this.createdBy = createdBy;
        this.maxMembers = maxMembers != null ? maxMembers : 100;
        this.isActive = true;
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

    public void updateInfo(String name, String description, Integer maxMembers) {
        if (name != null && !name.trim().isEmpty()) {
            this.name = name;
        }
        if (description != null) {
            this.description = description;
        }
        if (maxMembers != null && maxMembers > 0) {
            this.maxMembers = maxMembers;
        }
    }
    
    public void updateInfo(String name, String description, String passwordHash, Integer maxMembers) {
        if (name != null && !name.trim().isEmpty()) {
            this.name = name;
        }
        if (description != null) {
            this.description = description;
        }
        if (passwordHash != null) {
            this.passwordHash = passwordHash;
        }
        if (maxMembers != null && maxMembers > 0) {
            this.maxMembers = maxMembers;
        }
    }

    public void updatePassword(String passwordHash) {
        this.passwordHash = passwordHash;
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

    public boolean isAdmin(UUID userId) {
        return members.stream()
                .anyMatch(member -> member.getUserId().equals(userId) 
                        && member.getIsActive() 
                        && member.getRole() == ServerMember.ServerRole.ADMIN);
    }
}