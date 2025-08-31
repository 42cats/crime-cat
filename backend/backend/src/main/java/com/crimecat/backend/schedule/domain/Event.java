package com.crimecat.backend.schedule.domain;

import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private WebUser creator;

    @Column(nullable = false)
    private String title;

    @Lob
    private String description;

    @Column(nullable = false)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status;

    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    @Builder.Default
    private EventType eventType = EventType.FIXED;

    @Column(name = "min_participants", nullable = false)
    @Builder.Default
    private Integer minParticipants = 1;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "start_time")
    private LocalDateTime startTime;
    
    @Column(name = "end_time")
    private LocalDateTime endTime;

    private LocalDateTime scheduledAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * 비밀 일정 여부
     */
    @Column(name = "is_secret", nullable = false)
    @Builder.Default
    private Boolean isSecret = false;

    /**
     * BCrypt 해시된 비밀번호 (비밀 일정인 경우만 사용)
     */
    @Column(name = "secret_password")
    private String secretPassword;

    /**
     * 비밀번호 힌트 (선택사항)
     */
    @Column(name = "password_hint", length = 500)
    private String passwordHint;

    /**
     * 비밀 일정인지 확인
     */
    public boolean isSecretEvent() {
        return Boolean.TRUE.equals(isSecret);
    }

    /**
     * 비밀번호가 설정되어 있는지 확인
     */
    public boolean hasPassword() {
        return secretPassword != null && !secretPassword.isEmpty();
    }

    /**
     * 비밀번호 힌트가 있는지 확인
     */
    public boolean hasPasswordHint() {
        return passwordHint != null && !passwordHint.trim().isEmpty();
    }
}
