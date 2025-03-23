package com.crimecat.backend.guild.domain;

import com.crimecat.backend.guild.dto.ChannelRecordRequestDto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "RECORDS")
@NoArgsConstructor
@Getter
public class Record {

    @Id
    @UuidGenerator
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "CHANNEL_SNOWFLAKE", nullable = false)
    private String channelSnowflake;

    @Column(name = "MESSAGE", nullable = false)
    private String message;

    @Column(name = "INDEX", nullable = false)
    private Integer index;

    @Column(name = "GUILD_SNOWFLAKE", nullable = false)
    private String guildSnowflake;

    @JoinColumn(name = "GUILD_SNOWFLAKE", referencedColumnName = "SNOWFLAKE", insertable = false, updatable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Guild guild;

    public Record(String channelSnowflake, String message, Integer index, String guildSnowflake) {
        this.channelSnowflake = channelSnowflake;
        this.message = message;
        this.index = index;
        this.guildSnowflake = guildSnowflake;
    }

    public Record(ChannelRecordRequestDto channelRecordRequestDto, int index,
                  String guildSnowflake) {
        this(channelRecordRequestDto.getChannelSnowflake(), channelRecordRequestDto.getMessage(),
                index, guildSnowflake);
    }
}
