package com.crimecat.backend.guild.domain;


import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "PASSWORD_NOTE",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_guild_password_key", columnNames = {"GUILD_SNOWFLAKE", "PASSWORD_KEY"})
        }
)
@NoArgsConstructor
@Getter
@Setter
public class PasswordNote {
    @Id
    @UuidGenerator
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "GUILD_SNOWFLAKE", nullable = false)
    private String guildSnowflake;

    @Column(name = "CHANNEL_SNOWFLAKE", nullable = false)
    private String channelSnowflake;

    @JoinColumn(name = "GUILD_SNOWFLAKE", referencedColumnName = "SNOWFLAKE", insertable = false, updatable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Guild guild;

    @NotBlank
    @Column(name = "PASSWORD_KEY", nullable = false) // 🔥 unique 제거됨
    private String passwordKey;

    @NotBlank
    @Column(name = "CONTENT", nullable = false)
    private String content;

    @NotNull
    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;

    public PasswordNote(String guildSnowflake, String channelSnowflake, Guild guild, String passwordKey, String content) {
        this.guildSnowflake = guildSnowflake;
        this.channelSnowflake = channelSnowflake;
        this.guild = guild;
        this.passwordKey = passwordKey;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }
}
