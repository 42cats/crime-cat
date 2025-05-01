package com.crimecat.backend.user.repository;

import com.crimecat.backend.user.domain.DiscordUser;
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

}
