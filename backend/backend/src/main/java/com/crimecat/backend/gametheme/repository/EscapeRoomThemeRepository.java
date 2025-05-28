package com.crimecat.backend.gametheme.repository;

import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Set;
import java.util.UUID;

@Repository
public interface EscapeRoomThemeRepository extends JpaRepository<EscapeRoomTheme, UUID>, JpaSpecificationExecutor<EscapeRoomTheme> {
    
    /**
     * 활성화된 방탈출 테마 개수 조회
     */
    @Query("SELECT COUNT(et) FROM EscapeRoomTheme et WHERE et.isDeleted = false")
    long countActiveThemes();
    
    /**
     * 운영 중인 테마 수 조회
     */
    long countByIsOperating(boolean isOperating);
    
    /**
     * 플레이하지 않은 방탈출 테마 조회 (필터 적용)
     */
    @Query("SELECT et FROM EscapeRoomTheme et " +
           "LEFT JOIN et.locations el " +
           "WHERE et.id NOT IN :playedThemeIds " +
           "AND (:operatingOnly = false OR et.isOperating = true) " +
           "AND (:region IS NULL OR el.address LIKE CONCAT('%', :region, '%')) " +
           "AND (:minPrice IS NULL OR et.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR et.price <= :maxPrice) " +
           "AND (:minPlayers IS NULL OR et.playerMin >= :minPlayers) " +
           "AND (:maxPlayers IS NULL OR et.playerMax <= :maxPlayers) " +
           "AND (:minDifficulty IS NULL OR et.difficulty >= :minDifficulty) " +
           "AND (:maxDifficulty IS NULL OR et.difficulty <= :maxDifficulty) " +
           "AND et.publicStatus = true")
    Page<EscapeRoomTheme> findUnplayedThemes(@Param("playedThemeIds") Set<UUID> playedThemeIds,
                                             @Param("operatingOnly") boolean operatingOnly,
                                             @Param("region") String region,
                                             @Param("minPrice") Integer minPrice,
                                             @Param("maxPrice") Integer maxPrice,
                                             @Param("minPlayers") Integer minPlayers,
                                             @Param("maxPlayers") Integer maxPlayers,
                                             @Param("minDifficulty") Integer minDifficulty,
                                             @Param("maxDifficulty") Integer maxDifficulty,
                                             Pageable pageable);
}