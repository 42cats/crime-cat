package com.crimecat.backend.bot.guild.repository;

import com.crimecat.backend.bot.guild.domain.Record;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChannelRecordRepository extends JpaRepository<Record, UUID> {
    List<Record> findByGuildSnowflake(String guildSnowflake);

    List<Record> findByGuildSnowflakeAndChannelSnowflake(String guildSnowflake, String channelSnowflake);

    Long deleteByGuildSnowflakeAndChannelSnowflake(String guildSnowflake, String channelSnowflake);
}
