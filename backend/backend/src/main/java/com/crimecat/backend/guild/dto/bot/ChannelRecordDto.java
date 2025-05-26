package com.crimecat.backend.guild.dto.bot;

import com.crimecat.backend.guild.domain.Record;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class ChannelRecordDto {
    private String channelSnowflake;
    private String message;

    public ChannelRecordDto(Record record) {
        this(record.getChannelSnowflake(), record.getMessage());
    }
}
