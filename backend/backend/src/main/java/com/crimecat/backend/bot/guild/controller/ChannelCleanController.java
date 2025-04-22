package com.crimecat.backend.bot.guild.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crimecat.backend.bot.guild.dto.MessageDto;
import com.crimecat.backend.bot.guild.service.ChannelCleanService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/bot/v1/guilds/{guildSnowflake}/channels/cleans")
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
