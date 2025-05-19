package com.crimecat.backend.gameHistory.repository;

import com.crimecat.backend.gameHistory.domain.GameHistory;
import com.crimecat.backend.gameHistory.dto.IGameHistoryRankingDto;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GameHistoryRepository extends JpaRepository<GameHistory, UUID> {

	/**
	 * 특정 유저의 모든 게임 기록을 조회
	 * - user, guild 테이블을 JOIN FETCH로 즉시 로딩하여 N+1 방지
	 * - WHERE user.snowflake = :userSnowflake
	 * - 성능 고려: user.snowflake에 인덱스 필요
	 */
	@Query("SELECT gh FROM GameHistory gh JOIN FETCH gh.user JOIN FETCH gh.guild WHERE gh.user.discordSnowflake = :discordSnowflake")
	List<GameHistory> getGameHistoryByUserSnowflake(@Param("discordSnowflake") String discordSnowflake);

	/**
	 * 플레이 횟수가 특정 수치 이상인 유저들의 기록 목록
	 * - User 기준 GROUP BY 후 HAVING COUNT(*)
	 * - 성능주의: group by + having → 대량 데이터시 느릴 수 있음
	 * - Snowflake 기준 집계, COUNT(*) 기준
	 */
	@Query("SELECT gh FROM GameHistory gh JOIN FETCH gh.user u GROUP BY u.discordSnowflake HAVING COUNT(*) > :playCount")
	List<GameHistory> getGameHistoryWithPlayCountGreaterThan(@Param("playCount") Integer playCount);

	/**
	 * 전체 유저의 플레이 횟수를 내림차순 정렬하여 랭킹 반환
	 * - Projection(인터페이스 기반)으로 최소 필드만 조회
	 * - Pageable 지원
	 * - 성능 고려: COUNT + GROUP BY + ORDER BY → user.snowflake 인덱스 필요
	 */
	@Query(value = "SELECT gh.user.discordSnowflake as userSnowflake, COUNT(gh) as playCount "
		+ "FROM GameHistory gh " +
		"GROUP BY gh.user.discordSnowflake " +
		"ORDER BY playCount DESC")
	List<IGameHistoryRankingDto> getGameHistorySortingByPlayTimeWithPagination(Pageable pageable);


	/**
	 * 특정 유저가 특정 길드에서 게임 기록이 있는지 조회 (단건)
	 * - WHERE gh.user의 discordSnowflake AND guild.snowflake 조건
	 * - 로그인 사용자에게 관전 버튼/배지 표시 여부 판단 등에 활용
	 * - user.discordSnowflake + guild_snowflake 복합 인덱스 강력 권장
	 */
	@Query("SELECT gh FROM GameHistory gh WHERE gh.user.discordSnowflake = :discordSnowflake AND gh.guild.snowflake = :guildSnowflake")
	GameHistory findGameHistoryByUserSnowFlakeAndGuildSnowflake(@Param("discordSnowflake") String discordSnowflake, @Param("guildSnowflake") String guildSnowflake);

	/**
	 * 전체 게임 히스토리 조회 (단순 select)
	 * - 페이징 없음
	 * - 대량 데이터 시 비권장
	 */
	@Query("SELECT gh FROM GameHistory gh")
	List<GameHistory> findAllGameHistories();

	/**
	 * 특정 길드 + 디스코드 알림 설정 유저 조회
	 * - 조건이 NULL인 경우 필터링 무시 (동적 조건 where 절)
	 * - WHERE 절 내 OR + NULL 체크 → 쿼리 플랜 비효율 가능
	 * - guild_snowflake, discord_alarm 인덱스 필요
	 */
	@Query("SELECT gh FROM GameHistory gh JOIN gh.user u JOIN u.discordUser du " +
			"WHERE (:guildSnowflake IS NULL OR gh.guild.snowflake = :guildSnowflake) " +
			"AND (:discordAlarm IS NULL OR du.discordAlarm = :discordAlarm)")
	List<GameHistory> findUsersByGuildSnowflakeAndDiscordAlarm(@Param("guildSnowflake") String guildSnowflake,
														 @Param("discordAlarm") Boolean discordAlarm);

	/**
	 * 특정 유저의 게임 기록을 최신 순으로 정렬하여 조회
	 *
	 * ✅ 목적:
	 *   - 해당 유저의 게임 참여 이력을 최신순(createdAt DESC)으로 정렬하여 리스트로 반환
	 *   - 마이페이지, 유저 프로필, 활동 내역 등에서 사용 가능
	 *
	 */
	@Query("SELECT gh FROM GameHistory gh " +
			"WHERE gh.user.discordSnowflake = :discordSnowflake " +
			"ORDER BY gh.createdAt DESC")
	List<GameHistory> findGameHistoriesByUserSnowflakeOrderByCreatedAtDesc(@Param("discordSnowflake") String discordSnowflake);

	/**
	 * 전체 게임 히스토리 레코드 수
	 * - SELECT COUNT(*) FROM game_histories
	 * - 단순 통계용
	 */
	long count();


	/**
	 * 특정 길드의 모든 게임 기록을 조회 (정렬 포함)
	 */
	@Query(value = """
    SELECT gh.*
    FROM game_histories gh
    JOIN users u ON gh.user_id = u.id
    LEFT JOIN web_users wu ON u.web_user_id = wu.id
    WHERE gh.guild_snowflake = :guildSnowflake
    ORDER BY gh.created_at DESC
    """,
			countQuery = """
    SELECT COUNT(*)
    FROM game_histories gh
    JOIN users u ON gh.user_id = u.id
    LEFT JOIN web_users wu ON u.web_user_id = wu.id
    WHERE gh.guild_snowflake = :guildSnowflake
    """,
			nativeQuery = true
	)
	Page<GameHistory> findByGuild_Snowflake(
			@Param("guildSnowflake") String guildSnowflake,
			Pageable pageable
	);

	Page<GameHistory> searchByGuild_Snowflake(String guildSnowflake, Pageable pageable);

	Page<GameHistory> searchByUser_DiscordSnowflake(String discordUserSnowflake, Pageable pageable);

	Page<GameHistory> findByUser_DiscordSnowflake(String discordUserSnowflake, Pageable pageable);

	@Query("""
        SELECT gh
        FROM GameHistory gh
        JOIN gh.guild g
        LEFT JOIN gh.gameTheme gt
        WHERE gh.user.discordSnowflake = :discordUserSnowflake
        AND (
            (:keyword IS NULL OR :keyword = '' OR 
            LOWER(g.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(gt.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
        )
    """)
	Page<GameHistory> findByUserSnowflakeAndKeyword(
			@Param("discordUserSnowflake") String discordUserSnowflake,
			@Param("keyword") String keyword,
			Pageable pageable
	);
	
	/**
	 * 특정 길드의 게임 기록을 플레이어 이름 또는 캐릭터 이름으로 검색 (특수문자 이스케이프 처리 추가)
	 */
	@Query(value = """
    SELECT gh.*
    FROM game_histories gh
    JOIN users u ON gh.user_id = u.id
    LEFT JOIN web_users wu ON u.web_user_id = wu.id
    WHERE gh.guild_snowflake = :guildSnowflake
      AND (
        :keyword IS NULL OR :keyword = '' OR
        gh.character_name LIKE CONCAT('%', :keyword, '%') OR
        wu.nickname LIKE CONCAT('%', :keyword, '%')
      )
    ORDER BY gh.created_at DESC
    """,
			countQuery = """
    SELECT COUNT(*)
    FROM game_histories gh
    JOIN users u ON gh.user_id = u.id
    LEFT JOIN web_users wu ON u.id = wu.user_id
    WHERE gh.guild_snowflake = :guildSnowflake
      AND (
        :keyword IS NULL OR :keyword = '' OR
        gh.character_name LIKE CONCAT('%', :keyword, '%') OR
        wu.nickname LIKE CONCAT('%', :keyword, '%')
      )
    """,
			nativeQuery = true
	)
	Page<GameHistory> findByGuildSnowflakeAndKeyword(
			@Param("guildSnowflake") String guildSnowflake,
			@Param("keyword") String keyword,
			Pageable pageable
	);


	List<GameHistory> findByGuild_Id(UUID guildId);
	
	/**
	 * 특정 사용자가 특정 게임 테마를 플레이했는지 확인
	 * - 스포일러 기능(게임을 플레이한 사용자에게만 보이는 기능)을 위한 메서드
	 */
	@Query("SELECT COUNT(gh) > 0 FROM GameHistory gh " +
			"JOIN gh.user u " +
			"JOIN u.webUser wu " +
			"WHERE wu.id = :webUserId AND gh.gameTheme.id = :gameThemeId")
	boolean existsByDiscordUserIdAndGameThemeId(@Param("webUserId") UUID webUserId, @Param("gameThemeId") UUID gameThemeId);

	boolean existsByGameTheme_IdAndUser_Id(UUID gameThemeId, UUID userId);

	List<GameHistory> findAllByGuild_Snowflake(String guildSnowflake);
}