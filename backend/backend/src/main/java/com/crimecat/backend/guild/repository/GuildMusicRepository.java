package com.crimecat.backend.guild.repository;

import com.crimecat.backend.guild.domain.Music;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GuildMusicRepository extends JpaRepository<Music, UUID> {
    List<Music> findByGuildSnowflake(String guildSnowflake);

    Long deleteByGuildSnowflakeAndTitle(String guildSnowflake, String title);

    boolean existsByGuildSnowflakeAndTitle(String guildSnowflake, String title);

    boolean existsByGuildSnowflakeAndYoutubeUrl(String guildSnowflake, String youtubeUrl);
}
