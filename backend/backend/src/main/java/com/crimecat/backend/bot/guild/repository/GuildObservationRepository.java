package com.crimecat.backend.bot.guild.repository;

import com.crimecat.backend.bot.guild.domain.Observation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GuildObservationRepository extends JpaRepository<Observation, UUID> {
    Optional<Observation> findByGuildSnowflake(String guildSnowflake);

    boolean existsByGuildSnowflake(String guildSnowflake);
}
