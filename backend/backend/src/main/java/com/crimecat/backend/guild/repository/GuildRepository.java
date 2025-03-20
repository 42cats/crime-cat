package com.crimecat.backend.guild.repository;

import com.crimecat.backend.guild.domain.Guild;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GuildRepository extends JpaRepository<Guild, UUID> {
    Optional<Guild> findBySnowflake(String snowflake);

    Long deleteBySnowflake(String snowflake);
}
