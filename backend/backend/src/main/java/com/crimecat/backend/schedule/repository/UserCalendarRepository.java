package com.crimecat.backend.schedule.repository;

import com.crimecat.backend.schedule.domain.UserCalendar;
import com.crimecat.backend.webUser.domain.WebUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserCalendarRepository extends JpaRepository<UserCalendar, UUID> {
    
    // 기존 메서드 (단일 캘린더 지원 시 사용)
    Optional<UserCalendar> findByUser(WebUser user);
    
    // 다중 캘린더 지원을 위한 새로운 메서드들
    List<UserCalendar> findByUserIdOrderBySortOrder(UUID userId);
    
    List<UserCalendar> findByUserIdAndIsActiveOrderBySortOrder(UUID userId, Boolean isActive);
    
    int countByUserIdAndIsActive(UUID userId, Boolean isActive);
    
    Optional<UserCalendar> findByUserIdAndIcalUrl(UUID userId, String icalUrl);
    
    @Query("SELECT uc FROM UserCalendar uc WHERE uc.user.id = :userId AND uc.isActive = true ORDER BY uc.sortOrder")
    List<UserCalendar> findActiveCalendarsByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT COUNT(uc) FROM UserCalendar uc WHERE uc.user.id = :userId")
    int countByUserId(@Param("userId") UUID userId);
    
    boolean existsByUserIdAndIcalUrl(UUID userId, String icalUrl);
    
    // Discord 봇 전용 메서드들
    @Query("SELECT COUNT(uc) FROM UserCalendar uc WHERE uc.user.id = :userId AND uc.isActive = true")
    int countActiveCalendarsByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT MAX(uc.updatedAt) FROM UserCalendar uc WHERE uc.user.id = :userId AND uc.isActive = true")
    Optional<LocalDateTime> findLatestUpdateTimeByUserId(@Param("userId") UUID userId);
    
    // 동기화 상태별 캘린더 조회 (Discord 봇 부분 실패 대응)
    @Query("SELECT uc FROM UserCalendar uc WHERE uc.user.id = :userId AND uc.syncStatus = :syncStatus ORDER BY uc.sortOrder")
    List<UserCalendar> findByUserIdAndSyncStatus(@Param("userId") UUID userId, @Param("syncStatus") UserCalendar.SyncStatus syncStatus);
    
    @Query("SELECT uc FROM UserCalendar uc WHERE uc.user.id = :userId AND uc.isActive = true AND uc.syncStatus = :syncStatus ORDER BY uc.sortOrder")
    List<UserCalendar> findByUserIdAndIsActiveAndSyncStatus(@Param("userId") UUID userId, @Param("isActive") Boolean isActive, @Param("syncStatus") UserCalendar.SyncStatus syncStatus);
}
