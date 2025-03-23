package com.crimecat.backend.guild.domain;

import com.crimecat.backend.guild.dto.GuildMusicDto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.cglib.core.Local;
import org.springframework.util.StringUtils;

@Entity
@Table(name = "MUSICS")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Music {

    @Id
    @UuidGenerator
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "GUILD_SNOWFLAKE", nullable = false)
    private String guildSnowflake;

    @JoinColumn(name = "GUILD_SNOWFLAKE", referencedColumnName = "SNOWFLAKE", insertable = false, updatable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Guild guild;

    @NotBlank
    @Column(name = "TITLE", nullable = false)
    private String title;

    @NotBlank
    @Column(name = "YOUTUBE_URL", nullable = false)
    private String youtubeUrl;

    @NotBlank
    @Column(name = "THUMBNAIL", nullable = false)
    private String thumbnail;

    @NotBlank
    @Column(name = "DURATION", nullable = false)
    private String duration;

    @NotBlank
    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;

    public Music(String guildSnowflake, GuildMusicDto guildMusicDto) {
        this.guildSnowflake = guildSnowflake;
        this.title = guildMusicDto.getTitle();
        this.youtubeUrl = guildMusicDto.getYoutubeUrl();
        this.thumbnail = guildMusicDto.getThumbnail();
        this.duration = guildMusicDto.getDuration();
        this.createdAt = LocalDateTime.now();
    }
}
