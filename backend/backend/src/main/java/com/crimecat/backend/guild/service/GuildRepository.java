package com.crimecat.backend.guild.service;

import com.crimecat.backend.guild.domain.Guild;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/*
	gameHistory 저장 확인용 임시 클래스
 */
@Repository
public interface GuildRepository extends JpaRepository<Guild, UUID> {

	@Query("SELECT g FROM Guild g WHERE g.snowflake = :snowflake")
	Optional<Guild> findGuildByGuildSnowflake(@Param("snowflake") String guildSnowflake);
}
