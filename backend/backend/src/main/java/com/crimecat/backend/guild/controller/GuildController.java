package com.crimecat.backend.guild.controller;

import com.crimecat.backend.guild.dto.GuildDto;
import com.crimecat.backend.guild.dto.GuildResponseDto;
import com.crimecat.backend.guild.dto.MessageDto;
import com.crimecat.backend.guild.service.GuildService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/bot/guilds")
public class GuildController {
    private final GuildService guildService;

    @PostMapping
    public ResponseEntity<MessageDto<GuildResponseDto>> addGuild(@RequestBody GuildDto guildDto) {

        MessageDto<GuildResponseDto> messageDto = guildService.addGuild(guildDto);
        if (messageDto == null) {
            // TODO: use exception to handle error
            return new ResponseEntity<>(new MessageDto<>("already created", new GuildResponseDto(guildDto)),
                    HttpStatus.BAD_REQUEST);
        }
        return new ResponseEntity<>(messageDto, HttpStatus.OK);
    }

    @DeleteMapping("/{snowflake}")
    public MessageDto<?> deleteGuild(@PathVariable String snowflake) {
        guildService.deleteGuild(snowflake);
        return new MessageDto<>("Guild deleted successfully");
    }

    @GetMapping("/{snowflake}")
    public MessageDto<?> getGuild(@PathVariable String snowflake) {
        return new MessageDto<>("", guildService.getGuild(snowflake));
    }
}
