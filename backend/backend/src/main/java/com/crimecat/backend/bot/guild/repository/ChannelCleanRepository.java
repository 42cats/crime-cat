package com.crimecat.backend.bot.guild.repository;

import com.crimecat.backend.bot.guild.domain.Clean;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChannelCleanRepository extends JpaRepository<Clean, UUID> {
    List<Clean> findByGuildSnowflake(String guildSnowflake);

    Long deleteByGuildSnowflakeAndChannelSnowflake(String guildSnowflake, String channelSnowflake);
}
