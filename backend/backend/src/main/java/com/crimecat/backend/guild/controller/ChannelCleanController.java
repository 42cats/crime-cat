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
        try {
            return new MessageDto<>("Channel list founded successfully",
                    channelCleanService.getCleans(guildSnowflake));
        } catch (Exception e) {
            return new MessageDto<>("error occurred");
        }
    }

    @PostMapping("/{channelSnowflake}")
    public MessageDto<?> postClean(@PathVariable String guildSnowflake, @PathVariable String channelSnowflake) {
        try {
            return new MessageDto<>("Channel added successfully",
                    channelCleanService.addCleanChannel(guildSnowflake, channelSnowflake));
        } catch (Exception e) {
            return new MessageDto<>("error occurred");
        }
    }

    @DeleteMapping("/{channelSnowflake}")
    public MessageDto<?> deleteClean(@PathVariable String guildSnowflake, @PathVariable String channelSnowflake) {
        try {
            return new MessageDto<>("Channel deleted successfully",
                    channelCleanService.deleteClean(guildSnowflake, channelSnowflake));
        } catch (Exception e) {
            return new MessageDto<>("error occurred");
        }
    }
}
