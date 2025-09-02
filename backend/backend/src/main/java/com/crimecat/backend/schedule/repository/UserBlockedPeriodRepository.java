package com.crimecat.backend.schedule.repository;

import com.crimecat.backend.schedule.domain.UserBlockedPeriod;
import com.crimecat.backend.webUser.domain.WebUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserBlockedPeriodRepository extends JpaRepository<UserBlockedPeriod, UUID> {
    
    /**
     * 특정 사용자와 기간의 비활성화 정보 조회
     */
    Optional<UserBlockedPeriod> findByUserAndPeriodStart(WebUser user, LocalDate periodStart);
    
    /**
     * 특정 사용자 ID와 기간의 비활성화 정보 조회 (성능 최적화)
     */
    @Query("SELECT ubp FROM UserBlockedPeriod ubp WHERE ubp.user.id = :userId AND ubp.periodStart = :periodStart")
    Optional<UserBlockedPeriod> findByUserIdAndPeriodStart(@Param("userId") UUID userId, 
                                                           @Param("periodStart") LocalDate periodStart);
    
    /**
     * 특정 사용자의 모든 비활성화 기간 조회
     */
    List<UserBlockedPeriod> findByUserOrderByPeriodStartDesc(WebUser user);
    
    /**
     * 특정 사용자 ID의 모든 비활성화 기간 조회 (성능 최적화)
     */
    @Query("SELECT ubp FROM UserBlockedPeriod ubp WHERE ubp.user.id = :userId ORDER BY ubp.periodStart DESC")
    List<UserBlockedPeriod> findByUserIdOrderByPeriodStartDesc(@Param("userId") UUID userId);
    
    /**
     * 특정 날짜 이전의 만료된 기간 삭제 (자동 정리용)
     */
    @Modifying
    @Query("DELETE FROM UserBlockedPeriod ubp WHERE ubp.periodStart < :cutoffDate")
    int deleteByPeriodStartBefore(@Param("cutoffDate") LocalDate cutoffDate);
    
    /**
     * 특정 사용자의 특정 기간 삭제
     */
    void deleteByUserAndPeriodStart(WebUser user, LocalDate periodStart);
    
    /**
     * 특정 사용자 ID의 특정 기간 삭제 (성능 최적화)
     */
    @Modifying
    @Query("DELETE FROM UserBlockedPeriod ubp WHERE ubp.user.id = :userId AND ubp.periodStart = :periodStart")
    void deleteByUserIdAndPeriodStart(@Param("userId") UUID userId, @Param("periodStart") LocalDate periodStart);
    
    /**
     * 특정 사용자의 모든 비활성화 기간 삭제
     */
    void deleteByUser(WebUser user);
    
    /**
     * 전체 비활성화 기간 개수 조회
     */
    long count();
    
    /**
     * 특정 기간 이전의 레코드 개수 조회 (정리 작업 전 확인용)
     */
    @Query("SELECT COUNT(ubp) FROM UserBlockedPeriod ubp WHERE ubp.periodStart < :cutoffDate")
    long countByPeriodStartBefore(@Param("cutoffDate") LocalDate cutoffDate);
}