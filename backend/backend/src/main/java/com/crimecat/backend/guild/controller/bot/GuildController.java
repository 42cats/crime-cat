package com.crimecat.backend.guild.controller.bot;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crimecat.backend.guild.dto.bot.GuildDto;
import com.crimecat.backend.guild.dto.bot.GuildResponseDto;
import com.crimecat.backend.guild.dto.bot.MessageDto;
import com.crimecat.backend.guild.exception.GuildAlreadyExistsException;
import com.crimecat.backend.guild.service.bot.GuildService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/bot/v1/guilds")
public class GuildController {
    private final GuildService guildService;

    @PostMapping
    public ResponseEntity<MessageDto<GuildResponseDto>> addGuild(@RequestBody GuildDto guildDto) {
        try {
            MessageDto<GuildResponseDto> messageDto = guildService.addGuild(guildDto);
            return new ResponseEntity<>(messageDto, HttpStatus.OK);
        } catch (GuildAlreadyExistsException e) {
            // TODO: use exception to handle error
            return new ResponseEntity<>(new MessageDto<>(e.getMessage(), new GuildResponseDto(e.getGuild())),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{snowflake}")
    public MessageDto<?> deleteGuild(@PathVariable String snowflake) {
        guildService.deleteGuild(snowflake);
        return new MessageDto<>("Guild deleted successfully");
    }
}
