package com.crimecat.backend.schedule.repository;

import com.crimecat.backend.schedule.domain.EventPasswordAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 이벤트 비밀번호 입력 시도 기록 관리 리포지토리
 */
@Repository
public interface EventPasswordAttemptRepository extends JpaRepository<EventPasswordAttempt, UUID> {

    /**
     * 특정 IP에서 특정 시간 이후의 실패 시도 횟수 조회
     * Rate Limiting을 위한 쿼리
     */
    @Query("SELECT COUNT(epa) FROM EventPasswordAttempt epa " +
           "WHERE epa.ipAddress = :ipAddress " +
           "AND epa.attemptTime >= :since " +
           "AND epa.isSuccess = false")
    long countFailedAttemptsByIpSince(
            @Param("ipAddress") String ipAddress,
            @Param("since") LocalDateTime since
    );

    /**
     * 특정 사용자의 특정 시간 이후의 실패 시도 횟수 조회
     * Rate Limiting을 위한 쿼리 (로그인된 사용자)
     */
    @Query("SELECT COUNT(epa) FROM EventPasswordAttempt epa " +
           "WHERE epa.user.id = :userId " +
           "AND epa.attemptTime >= :since " +
           "AND epa.isSuccess = false")
    long countFailedAttemptsByUserSince(
            @Param("userId") UUID userId,
            @Param("since") LocalDateTime since
    );

    /**
     * 특정 이벤트에 대한 특정 IP의 실패 시도 횟수 조회
     */
    @Query("SELECT COUNT(epa) FROM EventPasswordAttempt epa " +
           "WHERE epa.event.id = :eventId " +
           "AND epa.ipAddress = :ipAddress " +
           "AND epa.attemptTime >= :since " +
           "AND epa.isSuccess = false")
    long countFailedAttemptsByEventAndIpSince(
            @Param("eventId") UUID eventId,
            @Param("ipAddress") String ipAddress,
            @Param("since") LocalDateTime since
    );

    /**
     * 특정 이벤트에 대한 모든 시도 기록 조회 (관리자용)
     */
    @Query("SELECT epa FROM EventPasswordAttempt epa " +
           "WHERE epa.event.id = :eventId " +
           "ORDER BY epa.attemptTime DESC")
    List<EventPasswordAttempt> findAllByEventIdOrderByAttemptTimeDesc(
            @Param("eventId") UUID eventId
    );

    /**
     * 특정 세션 ID로 성공한 인증 기록 조회
     */
    @Query("SELECT epa FROM EventPasswordAttempt epa " +
           "WHERE epa.sessionId = :sessionId " +
           "AND epa.isSuccess = true")
    List<EventPasswordAttempt> findSuccessfulAttemptsBySessionId(
            @Param("sessionId") String sessionId
    );

    /**
     * 지정된 시간 이전의 기록 삭제 (정리용)
     */
    @Query("DELETE FROM EventPasswordAttempt epa " +
           "WHERE epa.attemptTime < :before")
    void deleteAttemptsBefore(@Param("before") LocalDateTime before);

    /**
     * 특정 이벤트의 총 시도 횟수 (성공/실패 포함)
     */
    @Query("SELECT COUNT(epa) FROM EventPasswordAttempt epa " +
           "WHERE epa.event.id = :eventId")
    long countAllAttemptsByEvent(@Param("eventId") UUID eventId);

    /**
     * 특정 이벤트의 성공 횟수
     */
    @Query("SELECT COUNT(epa) FROM EventPasswordAttempt epa " +
           "WHERE epa.event.id = :eventId " +
           "AND epa.isSuccess = true")
    long countSuccessfulAttemptsByEvent(@Param("eventId") UUID eventId);
}