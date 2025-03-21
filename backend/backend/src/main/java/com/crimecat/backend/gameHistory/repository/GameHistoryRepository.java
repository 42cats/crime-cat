package com.crimecat.backend.gameHistory.repository;

import com.crimecat.backend.gameHistory.domain.GameHistory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GameHistoryRepository extends JpaRepository<GameHistory, UUID> {

	@Query("SELECT gh FROM GameHistory gh JOIN FETCH gh.user JOIN FETCH gh.guild WHERE gh.user.snowflake = :userSnowflake")
	List<GameHistory> getGameHistoryByUserSnowflake(@Param("userSnowflake") String userSnowflake);
}
