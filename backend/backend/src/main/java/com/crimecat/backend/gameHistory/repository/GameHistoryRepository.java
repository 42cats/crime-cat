package com.crimecat.backend.gameHistory.repository;

import com.crimecat.backend.gameHistory.domain.GameHistory;
import com.crimecat.backend.gameHistory.dto.IGameHistoryRankingDto;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GameHistoryRepository extends JpaRepository<GameHistory, UUID> {

	@Query("SELECT gh FROM GameHistory gh JOIN FETCH gh.user JOIN FETCH gh.guild WHERE gh.user.snowflake = :userSnowflake")
	List<GameHistory> getGameHistoryByUserSnowflake(@Param("userSnowflake") String userSnowflake);

	@Query("SELECT gh FROM GameHistory gh JOIN FETCH gh.user u GROUP BY u.snowflake HAVING COUNT(*) > :playCount")
	List<GameHistory> getGameHistoryWithPlayCountGreaterThan(@Param("playCount") Integer playCount);

@Query(value = "SELECT gh.user.snowflake as userSnowflake, COUNT(gh) as playCount FROM GameHistory gh " +
		"GROUP BY gh.user.snowflake " +
		"ORDER BY playCount DESC")
	List<IGameHistoryRankingDto> getGameHistoryWithPagination(Pageable pageable);
}
