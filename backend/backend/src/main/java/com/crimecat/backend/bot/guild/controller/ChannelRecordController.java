package com.crimecat.backend.bot.guild.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crimecat.backend.bot.guild.dto.ChannelRecordListResponseDto;
import com.crimecat.backend.bot.guild.dto.ChannelRecordRequestDto;
import com.crimecat.backend.bot.guild.dto.MessageDto;
import com.crimecat.backend.bot.guild.service.ChannelRecordService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/bot/v1/guilds/{guildSnowflake}/records")
@RequiredArgsConstructor
public class ChannelRecordController {
    private final ChannelRecordService channelRecordService;

    @GetMapping
    public MessageDto<?> getRecords(@PathVariable String guildSnowflake) {
        try {
            ChannelRecordListResponseDto dto = channelRecordService.getRecords(guildSnowflake);
            return new MessageDto<>("record founded", dto);
        } catch (Exception e) {
            return new MessageDto<>("error occurs");
        }
    }

    @PostMapping
    public MessageDto<?> postRecord(@PathVariable String guildSnowflake,
                                    @RequestBody ChannelRecordRequestDto channelRecordRequestDto) {
        channelRecordService.addRecord(guildSnowflake, channelRecordRequestDto);
        return new MessageDto<>("record update success");
    }

    @DeleteMapping("/{channelSnowflake}")
    public MessageDto<?> deleteRecord(@PathVariable String guildSnowflake,
                                      @PathVariable String channelSnowflake) {
        channelRecordService.deleteRecord(guildSnowflake, channelSnowflake);
        return new MessageDto<>("record delete success");
    }
}
