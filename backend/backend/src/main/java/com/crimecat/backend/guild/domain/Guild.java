package com.crimecat.backend.guild.domain;

import com.crimecat.backend.guild.dto.GuildDto;
import com.crimecat.backend.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "GUILDS")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Guild {

    @Id
    @UuidGenerator
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "SNOWFLAKE", nullable = false)
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

    public static Guild of(GuildDto guildDto) {
        Guild guild = new Guild();
        guild.snowflake = guildDto.getSnowflake();
        guild.name = guildDto.getName();
        guild.isWithdraw = false;
        guild.ownerSnowflake = guildDto.getOwnerSnowflake();
        return guild;
    }
}
