package com.crimecat.backend.bot.user.repository;

import com.crimecat.backend.bot.user.domain.DiscordUser;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DiscordUserRepository extends JpaRepository<DiscordUser, UUID> {

	@Query("SELECT u FROM DiscordUser u WHERE u.snowflake = :userSnowflake")
	Optional<DiscordUser> findBySnowflake(@Param("userSnowflake") String userSnowflake);

	@Query("SELECT u FROM DiscordUser u WHERE u.point > :point")
	List<DiscordUser> getUsersWithPointGreaterThan(@Param("point") Integer point);

}
