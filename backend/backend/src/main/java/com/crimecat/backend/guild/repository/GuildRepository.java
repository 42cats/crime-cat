package com.crimecat.backend.guild.repository;

import com.crimecat.backend.guild.domain.Guild;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

import java.util.Optional;
import java.util.UUID;

public interface GuildRepository extends JpaRepository<Guild, UUID> {
    Optional<Guild> findBySnowflake(String snowflake);

    Long deleteBySnowflake(String snowflake);

    boolean existsBySnowflake(String snowflake);

    /*
        gameHistory 저장 확인용 임시 메서드
     */
    @Query("SELECT g FROM Guild g WHERE g.snowflake = :snowflake")
    Optional<Guild> findGuildByGuildSnowflake(@Param("snowflake") String guildSnowflake);
    @Query("SELECT g FROM Guild g WHERE g.ownerSnowflake = :ownerSnowflake AND g.isWithdraw = false")
    List<Guild> findActiveGuildsByOwner(@Param("ownerSnowflake") String ownerSnowflake);
    @Query("SELECT g FROM Guild g WHERE g.isWithdraw = false")
    List<Guild> findAllActiveGuilds();
}
