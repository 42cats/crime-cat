package com.crimecat.backend.schedule.domain;

import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 이벤트 비밀번호 입력 시도 기록 엔티티
 * 보안 로깅 및 Brute Force 공격 방지를 위한 데이터 저장
 */
@Entity
@Table(name = "event_password_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventPasswordAttempt {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    /**
     * 비밀번호 입력 대상 이벤트
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    /**
     * 시도한 사용자 (로그인된 경우), 익명 접근 시 null
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private WebUser user;

    /**
     * 접속 IP 주소 (IPv4/IPv6 지원)
     */
    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    /**
     * 브라우저 정보 (User-Agent)
     */
    @Column(name = "user_agent", length = 1000)
    private String userAgent;

    /**
     * 시도 시간
     */
    @CreationTimestamp
    @Column(name = "attempt_time", nullable = false, updatable = false)
    private LocalDateTime attemptTime;

    /**
     * 비밀번호 입력 성공 여부
     */
    @Column(name = "is_success", nullable = false)
    @Builder.Default
    private Boolean isSuccess = false;

    /**
     * 세션 ID (성공한 경우 추적용)
     */
    @Column(name = "session_id")
    private String sessionId;

    /**
     * 실패한 시도 기록 생성
     */
    public static EventPasswordAttempt createFailedAttempt(
            Event event, 
            WebUser user, 
            String ipAddress, 
            String userAgent) {
        return EventPasswordAttempt.builder()
                .event(event)
                .user(user)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .isSuccess(false)
                .build();
    }

    /**
     * 성공한 시도 기록 생성
     */
    public static EventPasswordAttempt createSuccessAttempt(
            Event event, 
            WebUser user, 
            String ipAddress, 
            String userAgent, 
            String sessionId) {
        return EventPasswordAttempt.builder()
                .event(event)
                .user(user)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .isSuccess(true)
                .sessionId(sessionId)
                .build();
    }

    /**
     * 익명 사용자의 실패 시도 기록 생성
     */
    public static EventPasswordAttempt createAnonymousFailedAttempt(
            Event event, 
            String ipAddress, 
            String userAgent) {
        return EventPasswordAttempt.builder()
                .event(event)
                .user(null)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .isSuccess(false)
                .build();
    }

    /**
     * 익명 사용자의 성공 시도 기록 생성
     */
    public static EventPasswordAttempt createAnonymousSuccessAttempt(
            Event event, 
            String ipAddress, 
            String userAgent, 
            String sessionId) {
        return EventPasswordAttempt.builder()
                .event(event)
                .user(null)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .isSuccess(true)
                .sessionId(sessionId)
                .build();
    }
}