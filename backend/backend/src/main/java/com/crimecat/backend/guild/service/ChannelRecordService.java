package com.crimecat.backend.guild.service;

import com.crimecat.backend.guild.domain.Record;
import com.crimecat.backend.guild.dto.ChannelRecordDto;
import com.crimecat.backend.guild.dto.ChannelRecordListResponseDto;
import com.crimecat.backend.guild.dto.ChannelRecordRequestDto;
import com.crimecat.backend.guild.repository.ChannelRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChannelRecordService {
    private final ChannelRecordRepository channelRecordRepository;

    public ChannelRecordListResponseDto getRecords(String guildSnowflake) {
        return new ChannelRecordListResponseDto(
                channelRecordRepository.findByGuildSnowflake(guildSnowflake).stream()
                        .sorted(Comparator.comparingInt(Record::getIndex))
                        .map(ChannelRecordDto::new)
                        .toList()
        );
    }

    public void addRecord(String guildSnowflake, ChannelRecordRequestDto channelRecordRequestDto) {
        Optional<Record> record = channelRecordRepository.findByGuildSnowflakeAndChannelSnowflake(
                guildSnowflake, channelRecordRequestDto.getChannelSnowflake()
        ).stream()
                .sorted(Comparator.comparingInt(Record::getIndex).reversed())
                .limit(1)
                .findAny();
        int index = 0;
        if (record.isPresent()) {
            index = record.get().getIndex() + 1;
        }
        channelRecordRepository.save(new Record(channelRecordRequestDto, index, guildSnowflake));
    }

    public void deleteRecord(String guildSnowflake, String channelSnowflake) {
        long deletedNum = channelRecordRepository.deleteByGuildSnowflakeAndChannelSnowflake(guildSnowflake,
                channelSnowflake);
        if (deletedNum == 0) {
            throw new RuntimeException();
        }
    }
}
