package com.crimecat.backend.guild.controller;

import com.crimecat.backend.guild.dto.MessageDto;
import com.crimecat.backend.guild.service.ChannelCleanService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/bot/guilds/{guildSnowflake}/channels/cleans")
public class ChannelCleanController {
    private final ChannelCleanService channelCleanService;

    @GetMapping
    public MessageDto<?> getCleans(@PathVariable String guildSnowflake) {
        return new MessageDto<>("Channel list founded successfully",
                channelCleanService.getCleans(guildSnowflake));
    }

    @PostMapping("/{channelSnowflake}")
    public MessageDto<?> postClean(@PathVariable String guildSnowflake, @PathVariable String channelSnowflake) {
        return new MessageDto<>("Channel added successfully",
                channelCleanService.addCleanChannel(guildSnowflake, channelSnowflake));
    }

    @DeleteMapping("/{channelSnowflake}")
    public MessageDto<?> deleteClean(@PathVariable String guildSnowflake, @PathVariable String channelSnowflake) {
        return new MessageDto<>("Channel deleted successfully",
                channelCleanService.deleteClean(guildSnowflake, channelSnowflake));
    }
}
