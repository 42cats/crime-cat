package com.crimecat.backend.guild.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

@Entity
@Table(name = "MUSIC")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Music {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @JoinColumn(name = "GUILD_SNOWFLAKE", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Guild guild;

    @Column(name = "TITLE", nullable = false)
    private String title;

    @Column(name = "YOUTUBE_URL", nullable = false)
    private String youtubeUrl;

    @Column(name = "THUMBNAIL", nullable = false)
    private String thumbnail;

    @Column(name = "DURATION", nullable = false)
    private String duration;

    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;
}
