package com.crimecat.backend.bot.guild.dto;

import com.crimecat.backend.bot.guild.domain.Record;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class ChannelRecordDto {
    private String channelSnowflake;
    private String message;

    public ChannelRecordDto(Record record) {
        this(record.getChannelSnowflake(), record.getMessage());
    }
}
