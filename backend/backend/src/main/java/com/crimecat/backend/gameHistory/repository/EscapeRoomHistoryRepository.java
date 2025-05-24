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
}