package com.crimecat.backend.gameHistory.repository;

import com.crimecat.backend.gameHistory.domain.EscapeRoomHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EscapeRoomHistoryRepository extends JpaRepository<EscapeRoomHistory, UUID> {
    
    /**
     * 특정 사용자의 모든 방탈출 기록 조회 (페이징)
     */
    Page<EscapeRoomHistory> findByUserIdOrderByPlayDateDesc(UUID userId, Pageable pageable);
    
    /**
     * 특정 테마에 대한 모든 공개 기록 조회 (페이징)
     */
    @Query("SELECT erh FROM EscapeRoomHistory erh WHERE erh.escapeRoomTheme.id = :themeId AND erh.isPublic = true ORDER BY erh.playDate DESC")
    Page<EscapeRoomHistory> findPublicHistoriesByThemeId(@Param("themeId") UUID themeId, Pageable pageable);
    
    /**
     * 특정 사용자가 특정 테마를 플레이한 기록이 있는지 확인
     */
    boolean existsByUserIdAndEscapeRoomThemeId(UUID userId, UUID themeId);
    
    /**
     * 특정 사용자의 특정 테마 기록 조회
     */
    List<EscapeRoomHistory> findByUserIdAndEscapeRoomThemeIdOrderByPlayDateDesc(UUID userId, UUID themeId);
    
    /**
     * 특정 테마의 통계 정보 조회 (성공률, 평균 탈출 시간 등)
     */
    @Query("SELECT " +
           "COUNT(erh) as totalCount, " +
           "SUM(CASE WHEN erh.isSuccess = true THEN 1 ELSE 0 END) as successCount, " +
           "AVG(CASE WHEN erh.isSuccess = true THEN erh.escapeTimeMinutes ELSE NULL END) as avgEscapeTime, " +
           "AVG(erh.satisfaction) as avgSatisfaction, " +
           "AVG(erh.feltDifficulty) as avgFeltDifficulty " +
           "FROM EscapeRoomHistory erh " +
           "WHERE erh.escapeRoomTheme.id = :themeId AND erh.isPublic = true")
    Optional<Object[]> findThemeStatistics(@Param("themeId") UUID themeId);
    
    /**
     * 특정 사용자의 통계 정보 조회
     */
    @Query("SELECT " +
           "COUNT(erh) as totalCount, " +
           "SUM(CASE WHEN erh.isSuccess = true THEN 1 ELSE 0 END) as successCount, " +
           "COUNT(DISTINCT erh.escapeRoomTheme.id) as uniqueThemeCount " +
           "FROM EscapeRoomHistory erh " +
           "WHERE erh.user.id = :userId")
    Optional<Object[]> findUserStatistics(@Param("userId") UUID userId);
    
    /**
     * 특정 기록이 특정 사용자의 것인지 확인
     */
    boolean existsByIdAndUserId(UUID id, UUID userId);
    
    /**
     * 최근 기록 조회 (홈 화면용)
     */
    @Query("SELECT erh FROM EscapeRoomHistory erh WHERE erh.isPublic = true ORDER BY erh.createdAt DESC")
    List<EscapeRoomHistory> findRecentHistories(Pageable pageable);
}