package com.crimecat.backend.guild.controller;

import com.crimecat.backend.guild.dto.ChannelRecordListResponseDto;
import com.crimecat.backend.guild.dto.ChannelRecordRequestDto;
import com.crimecat.backend.guild.dto.MessageDto;
import com.crimecat.backend.guild.service.ChannelRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/bot/guilds/{guildSnowflake}/records")
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
