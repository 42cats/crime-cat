package com.crimecat.backend.gametheme.repository;

import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CrimesceneThemeRepository extends JpaRepository<CrimesceneTheme, UUID>, JpaSpecificationExecutor<CrimesceneTheme> {

  @Query("SELECT c FROM CrimesceneTheme c LEFT JOIN FETCH c.team t LEFT JOIN FETCH t.members WHERE c.id = :id")
  Optional<CrimesceneTheme> findByIdWithTeamAndMembers(@Param("id") UUID id);
  
  @Query("SELECT DISTINCT ct FROM CrimesceneTheme ct " +
         "JOIN FETCH ct.author " +
         "LEFT JOIN FETCH ct.team t " +
         "LEFT JOIN FETCH t.members " +
         "LEFT JOIN FETCH ct.guild " +
         "WHERE ct.id = :id")
  Optional<CrimesceneTheme> findByIdWithAllRelations(@Param("id") UUID id);

  @Query("SELECT c FROM CrimesceneTheme c WHERE c.guildSnowflake = :guildSnowflake")
  Optional<CrimesceneTheme> findByGuildSnowflake(String guildSnowflake);

  @Query("SELECT ct FROM CrimesceneTheme ct " +
         "LEFT JOIN FETCH ct.team t " +
         "LEFT JOIN FETCH ct.author " +
         "WHERE ct.team.id = :teamId")
  List<CrimesceneTheme> findByTeamId(@Param("teamId") UUID teamId);

  /**
   * 여러 팀의 크라임씬 테마를 한 번에 조회 (삭제되지 않은 것만)
   */
  @Query("SELECT DISTINCT ct FROM CrimesceneTheme ct " +
          "LEFT JOIN FETCH ct.team t " +
          "LEFT JOIN FETCH ct.author " +
          "WHERE t.id IN :teamIds " +
          "AND ct.isDeleted = false " +
          "ORDER BY ct.createdAt DESC")
  List<CrimesceneTheme> findByTeamIdsAndNotDeleted(@Param("teamIds") List<UUID> teamIds);

  /**
   * 활성화된 크라임씬 테마 개수 조회
   */
  @Query("SELECT COUNT(ct) FROM CrimesceneTheme ct WHERE ct.isDeleted = false")
  long countActiveThemes();

  /**
   * 플레이하지 않은 크라임씬 테마 조회 (필터 적용)
   */
  @Query("SELECT ct FROM CrimesceneTheme ct " +
          "WHERE ct.id NOT IN :playedThemeIds " +
          "AND (:minPrice IS NULL OR ct.price >= :minPrice) " +
          "AND (:maxPrice IS NULL OR ct.price <= :maxPrice) " +
          "AND (:minPlayers IS NULL OR ct.playerMin >= :minPlayers) " +
          "AND (:maxPlayers IS NULL OR ct.playerMax <= :maxPlayers) " +
          "AND (:minDifficulty IS NULL OR ct.difficulty >= :minDifficulty) " +
          "AND (:maxDifficulty IS NULL OR ct.difficulty <= :maxDifficulty) " +
          "AND ct.publicStatus = true " +
          "AND ct.isDeleted = false")
  Page<CrimesceneTheme> findUnplayedThemes(@Param("playedThemeIds") Set<UUID> playedThemeIds,
                                           @Param("minPrice") Integer minPrice,
                                           @Param("maxPrice") Integer maxPrice,
                                           @Param("minPlayers") Integer minPlayers,
                                           @Param("maxPlayers") Integer maxPlayers,
                                           @Param("minDifficulty") Integer minDifficulty,
                                           @Param("maxDifficulty") Integer maxDifficulty,
                                           Pageable pageable);

}
