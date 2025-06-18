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
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "voice_session_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class VoiceSessionLog {

    @Id
    @JdbcTypeCode(SqlTypes.BINARY)
    @UuidGenerator
    @Column(name = "id", columnDefinition = "BINARY(16)", updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "server_id", nullable = false)
    private ChatServer server;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private ServerChannel channel;

    @Column(name = "user_id", nullable = false, columnDefinition = "BINARY(16)")
    @JdbcTypeCode(SqlTypes.BINARY)
    private UUID userId;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "effects_used", columnDefinition = "JSON")
    private String effectsUsed;

    @CreatedDate
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Builder
    public VoiceSessionLog(ChatServer server, ServerChannel channel, UUID userId, String username, 
                          LocalDateTime startTime, LocalDateTime endTime, String effectsUsed) {
        this.server = server;
        this.channel = channel;
        this.userId = userId;
        this.username = username;
        this.startTime = startTime;
        this.endTime = endTime;
        this.effectsUsed = effectsUsed;
    }

    public void endSession(LocalDateTime endTime, String effectsUsed) {
        this.endTime = endTime;
        this.effectsUsed = effectsUsed;
    }
}