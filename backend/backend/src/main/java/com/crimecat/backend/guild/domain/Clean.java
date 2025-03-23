package com.crimecat.backend.guild.domain;

import com.crimecat.backend.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "CLEANS")
@NoArgsConstructor
@Getter
public class Clean {

    @Id
    @UuidGenerator
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "CHANNEL_SNOWFLAKE", nullable = false)
    private String channelSnowflake;

    @Column(name = "GUILD_SNOWFLAKE", nullable = false)
    private String guildSnowflake;

    @JoinColumn(name = "GUILD_SNOWFLAKE", referencedColumnName = "SNOWFLAKE", insertable = false, updatable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Guild guild;

    public Clean(String channelSnowflake, String guildSnowflake) {
        this.channelSnowflake = channelSnowflake;
        this.guildSnowflake = guildSnowflake;
    }
}
