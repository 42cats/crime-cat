package com.crimecat.backend.gameHistory.repository;

import com.crimecat.backend.gameHistory.domain.EscapeRoomHistory;
import com.crimecat.backend.gameHistory.dto.integrated.ThemePlayCountDto;
import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface EscapeRoomHistoryRepository extends JpaRepository<EscapeRoomHistory, UUID> {

    /**
     * ID로 조회 (삭제되지 않은 기록만)
     */
    Optional<EscapeRoomHistory> findByIdAndDeletedAtIsNull(UUID id);
    
    /**
     * 사용자의 특정 테마 기록 조회 (삭제되지 않은 기록만)
     */
    List<EscapeRoomHistory> findByWebUserIdAndEscapeRoomThemeIdAndDeletedAtIsNull(UUID userId, UUID themeId);
    
    /**
     * 사용자의 기록 목록 조회 (플레이 날짜 내림차순, 삭제되지 않은 기록만)
     */
    Page<EscapeRoomHistory> findByWebUserIdAndDeletedAtIsNullOrderByPlayDateDesc(UUID userId, Pageable pageable);
    
    /**
     * 사용자의 기록 개수 조회 (삭제되지 않은 기록만)
     */
    Long countByWebUserIdAndDeletedAtIsNull(UUID userId);
    
    /**
     * 특정 테마의 기록 목록 조회 (삭제되지 않은 기록만)
     */
    @Query("SELECT erh FROM EscapeRoomHistory erh " +
           "JOIN FETCH erh.escapeRoomTheme et " +
           "JOIN FETCH erh.webUser wu " +
           "WHERE erh.escapeRoomTheme.id = :themeId " +
           "AND erh.deletedAt IS NULL " +
           "ORDER BY erh.playDate DESC")
    Page<EscapeRoomHistory> findByEscapeRoomThemeIdAndDeletedAtIsNull(@Param("themeId") UUID themeId, Pageable pageable);
    
    /**
     * 사용자가 특정 테마를 플레이했는지 확인 (삭제되지 않은 기록만)
     */
    boolean existsByWebUserIdAndEscapeRoomThemeIdAndDeletedAtIsNull(UUID userId, UUID themeId);
    
    /**
     * 최근 생성된 기록 조회 (삭제되지 않은 기록만)
     */
    @Query("SELECT erh FROM EscapeRoomHistory erh " +
           "JOIN FETCH erh.escapeRoomTheme et " +
           "JOIN FETCH erh.webUser wu " +
           "WHERE erh.deletedAt IS NULL " +
           "ORDER BY erh.createdAt DESC")
    List<EscapeRoomHistory> findByDeletedAtIsNullOrderByCreatedAtDesc(Pageable pageable);
    
    /**
     * 특정 테마의 기록 목록 조회 - 사용자 자신의 기록을 먼저 표시
     * @param themeId 테마 ID
     * @param userId 현재 사용자 ID
     * @param pageable 페이징 정보
     * @return 사용자 기록이 우선, 그 다음 날짜 내림차순으로 정렬된 기록
     */
    @Query("SELECT erh FROM EscapeRoomHistory erh " +
           "JOIN FETCH erh.escapeRoomTheme et " +
           "JOIN FETCH erh.webUser wu " +
           "WHERE erh.escapeRoomTheme.id = :themeId " +
           "AND erh.deletedAt IS NULL " +
           "ORDER BY " +
           "CASE WHEN erh.webUser.id = :userId THEN 0 ELSE 1 END, " +
           "erh.playDate DESC")
    Page<EscapeRoomHistory> findByThemeIdWithUserFirst(@Param("themeId") UUID themeId, 
                                                       @Param("userId") UUID userId, 
                                                       Pageable pageable);
    
    /**
     * 특정 테마의 통계 정보 조회
     * @param themeId 테마 ID
     * @return 통계 정보 (총 플레이 수, 성공률, 평균 클리어 시간, 평균 평점 등)
     */
    @Query("SELECT " +
           "COUNT(erh) as totalPlays, " +
           "COUNT(CASE WHEN erh.successStatus = 'SUCCESS' THEN 1 END) as successCount, " +
           "AVG(CASE WHEN erh.successStatus = 'SUCCESS' THEN erh.clearTime END) as avgClearTime, " +
           "AVG(erh.difficultyRating) as avgDifficultyRating, " +
           "AVG(erh.funRating) as avgFunRating, " +
           "AVG(erh.storyRating) as avgStoryRating, " +
           "AVG(erh.teamSize) as avgTeamSize, " +
           "MIN(CASE WHEN erh.successStatus = 'SUCCESS' THEN erh.clearTime END) as minClearTime, " +
           "MAX(CASE WHEN erh.successStatus = 'SUCCESS' THEN erh.clearTime END) as maxClearTime " +
           "FROM EscapeRoomHistory erh " +
           "WHERE erh.escapeRoomTheme.id = :themeId " +
           "AND erh.deletedAt IS NULL")
    ThemeStatistics getThemeStatistics(@Param("themeId") UUID themeId);
    
    /**
     * 사용자별 테마 통계 조회
     * @param themeId 테마 ID
     * @param userId 사용자 ID
     * @return 특정 사용자의 테마 플레이 기록 통계
     */
    @Query("SELECT " +
           "COUNT(erh) as totalPlays, " +
           "COUNT(CASE WHEN erh.successStatus = 'SUCCESS' THEN 1 END) as successCount, " +
           "MIN(erh.playDate) as firstPlayDate, " +
           "MAX(erh.playDate) as lastPlayDate, " +
           "MIN(CASE WHEN erh.successStatus = 'SUCCESS' THEN erh.clearTime END) as bestClearTime " +
           "FROM EscapeRoomHistory erh " +
           "WHERE erh.escapeRoomTheme.id = :themeId " +
           "AND erh.webUser.id = :userId " +
           "AND erh.deletedAt IS NULL")
    UserThemeStatistics getUserThemeStatistics(@Param("themeId") UUID themeId, 
                                               @Param("userId") UUID userId);
    
    /**
     * 특정 테마의 난이도별 성공률 조회
     * @param themeId 테마 ID
     * @return 난이도별 성공률 통계
     */
    @Query("SELECT " +
           "erh.teamSize as teamSize, " +
           "COUNT(erh) as totalPlays, " +
           "COUNT(CASE WHEN erh.successStatus = 'SUCCESS' THEN 1 END) as successCount, " +
           "AVG(CASE WHEN erh.successStatus = 'SUCCESS' THEN erh.clearTime END) as avgClearTime " +
           "FROM EscapeRoomHistory erh " +
           "WHERE erh.escapeRoomTheme.id = :themeId " +
           "AND erh.deletedAt IS NULL " +
           "GROUP BY erh.teamSize " +
           "ORDER BY erh.teamSize")
    List<TeamSizeStatistics> getTeamSizeStatistics(@Param("themeId") UUID themeId);
    
    /**
     * 최근 플레이한 테마 목록 조회 (중복 제거)
     * @param userId 사용자 ID
     * @param limit 최대 개수
     * @return 최근 플레이한 테마 목록
     */
    @Query("SELECT DISTINCT erh.escapeRoomTheme " +
           "FROM EscapeRoomHistory erh " +
           "WHERE erh.webUser.id = :userId " +
           "AND erh.deletedAt IS NULL " +
           "ORDER BY MAX(erh.playDate) DESC")
    List<EscapeRoomTheme> findRecentlyPlayedThemes(@Param("userId") UUID userId, Pageable pageable);
    
    /**
     * 인터페이스 - 테마 통계
     */
    interface ThemeStatistics {
        Long getTotalPlays();
        Long getSuccessCount();
        Double getAvgClearTime();
        Double getAvgDifficultyRating();
        Double getAvgFunRating();
        Double getAvgStoryRating();
        Double getAvgTeamSize();
        Integer getMinClearTime();
        Integer getMaxClearTime();
    }
    
    /**
     * 인터페이스 - 사용자별 테마 통계
     */
    interface UserThemeStatistics {
        Long getTotalPlays();
        Long getSuccessCount();
        LocalDate getFirstPlayDate();
        LocalDate getLastPlayDate();
        Integer getBestClearTime();
    }
    
    /**
     * 인터페이스 - 팀 크기별 통계
     */
    interface TeamSizeStatistics {
        Integer getTeamSize();
        Long getTotalPlays();
        Long getSuccessCount();
        Double getAvgClearTime();
    }
    
    /**
     * 사용자의 모든 방탈출 기록 조회 (삭제되지 않은 것만)
     */
    Page<EscapeRoomHistory> findByWebUserIdAndDeletedAtIsNull(UUID userId, Pageable pageable);
    
    /**
     * 사용자가 플레이한 고유 테마 ID 목록 조회
     */
    @Query("SELECT DISTINCT erh.escapeRoomTheme.id FROM EscapeRoomHistory erh " +
           "WHERE erh.webUser.id = :userId AND erh.deletedAt IS NULL")
    Set<UUID> findDistinctThemeIdsByUserId(@Param("userId") UUID userId);
    
    /**
     * 사용자가 플레이한 고유 테마 수 조회
     */
    @Query("SELECT COUNT(DISTINCT erh.escapeRoomTheme.id) FROM EscapeRoomHistory erh " +
           "WHERE erh.webUser.id = :userId AND erh.deletedAt IS NULL")
    long countDistinctThemesByUserId(@Param("userId") UUID userId);
    
    /**
     * 사용자의 특정 테마 플레이 횟수 조회
     */
    @Query("SELECT COUNT(erh) FROM EscapeRoomHistory erh " +
           "WHERE erh.webUser.id = :userId " +
           "AND erh.escapeRoomTheme.id = :themeId " +
           "AND erh.deletedAt IS NULL")
    int countByWebUserIdAndEscapeRoomThemeId(@Param("userId") UUID userId, @Param("themeId") UUID themeId);
    
    /**
     * 사용자의 성공 상태별 기록 수 조회
     */
    @Query("SELECT COUNT(erh) FROM EscapeRoomHistory erh " +
           "WHERE erh.webUser.id = :userId " +
           "AND erh.successStatus = :status " +
           "AND erh.deletedAt IS NULL")
    long countByWebUserIdAndSuccessStatus(@Param("userId") UUID userId, @Param("status") String status);
    
    /**
     * 사용자의 테마별 플레이 횟수를 한 번에 조회 (N+1 방지)
     */
    @Query("SELECT new com.crimecat.backend.gameHistory.dto.integrated.ThemePlayCountDto(" +
           "erh.escapeRoomTheme.id, COUNT(erh)) " +
           "FROM EscapeRoomHistory erh " +
           "WHERE erh.webUser.id = :userId " +
           "AND erh.escapeRoomTheme.id IN :themeIds " +
           "AND erh.deletedAt IS NULL " +
           "GROUP BY erh.escapeRoomTheme.id")
    List<ThemePlayCountDto> findPlayCountsByUserAndThemes(@Param("userId") UUID userId, 
                                                          @Param("themeIds") List<UUID> themeIds);
}