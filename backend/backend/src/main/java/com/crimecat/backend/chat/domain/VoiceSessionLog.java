package com.crimecat.backend.chat.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "voice_session_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class VoiceSessionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

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
    public VoiceSessionLog(String userId, String username, LocalDateTime startTime, 
                          LocalDateTime endTime, String effectsUsed) {
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