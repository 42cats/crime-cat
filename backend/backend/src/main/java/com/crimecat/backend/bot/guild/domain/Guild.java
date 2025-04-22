package com.crimecat.backend.bot.guild.domain;

import com.crimecat.backend.bot.guild.dto.GuildDto;
import com.crimecat.backend.bot.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "GUILDS")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@ToString
public class Guild {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "SNOWFLAKE", nullable = false, unique = true)
    private String snowflake;

    @Column(name = "NAME", nullable = false)
    private String name;

    @Column(name = "IS_WITHDRAW", nullable = false)
    private boolean isWithdraw;

    @Column(name = "OWNER_SNOWFLAKE", nullable = false)
    private String ownerSnowflake;

    @JoinColumn(name = "OWNER_SNOWFLAKE", referencedColumnName = "SNOWFLAKE", insertable = false, updatable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @NotNull
    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;

    public static Guild of(GuildDto guildDto) {
        Guild guild = new Guild();
        guild.snowflake = guildDto.getSnowflake();
        guild.name = guildDto.getName();
        guild.isWithdraw = false;
        guild.ownerSnowflake = guildDto.getOwnerSnowflake();
        guild.createdAt = guildDto.getCreatedAt();
        return guild;
    }

    public void setIsWithdraw(boolean isWithdraw) {
        this.isWithdraw = isWithdraw;
    }
}
