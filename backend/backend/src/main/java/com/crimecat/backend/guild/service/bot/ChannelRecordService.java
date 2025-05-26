package com.crimecat.backend.guild.service.bot;

import com.crimecat.backend.guild.domain.Record;
import com.crimecat.backend.guild.dto.bot.ChannelRecordDto;
import com.crimecat.backend.guild.dto.bot.ChannelRecordListResponseDto;
import com.crimecat.backend.guild.dto.bot.ChannelRecordRequestDto;
import com.crimecat.backend.guild.repository.ChannelRecordRepository;
import org.springframework.transaction.annotation.Transactional;
import jakarta.validation.ConstraintViolationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChannelRecordService {
    private final ChannelRecordRepository channelRecordRepository;
    private final GuildQueryService guildQueryService;

    public ChannelRecordListResponseDto getRecords(String guildSnowflake) {
        if (!guildQueryService.existsBySnowflake(guildSnowflake)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "guild not exists");
        }
        return new ChannelRecordListResponseDto(
                channelRecordRepository.findByGuildSnowflake(guildSnowflake).stream()
                        .sorted(Comparator.comparingInt(Record::getIndex))
                        .map(ChannelRecordDto::new)
                        .toList()
        );
    }

    public void addRecord(String guildSnowflake, ChannelRecordRequestDto channelRecordRequestDto) {
        if (!guildQueryService.existsBySnowflake(guildSnowflake)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "guild not exists");
        }
        // TODO: getLastIndex()
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
        Record newRecord = new Record(channelRecordRequestDto, index, guildSnowflake);
        // TODO: ConstraintViolationException 처리 (validation 처리)
        try {
            channelRecordRepository.save(newRecord);
        } catch (Exception e) {
            Throwable t = e.getCause();
            while (t != null && !(t instanceof ConstraintViolationException)) {
                t = t.getCause();
            }
            if (t != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body require element need");
            }
            throw e;
        }
    }

    @Transactional
    public void deleteRecord(String guildSnowflake, String channelSnowflake) {
        if (!guildQueryService.existsBySnowflake(guildSnowflake)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "guild not exists");
        }
        long deletedNum = channelRecordRepository.deleteByGuildSnowflakeAndChannelSnowflake(guildSnowflake,
                channelSnowflake);
        if (deletedNum == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "record not exists");
        }
    }
}
