package com.crimecat.backend.guild.dto.bot;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@AllArgsConstructor
@Getter
public class ChannelRecordListResponseDto {
    private List<ChannelRecordDto> records;
}
