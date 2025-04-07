package com.crimecat.backend.guild.controller;

import com.crimecat.backend.guild.dto.GuildDto;
import com.crimecat.backend.guild.dto.GuildResponseDto;
import com.crimecat.backend.guild.dto.MessageDto;
import com.crimecat.backend.guild.exception.GuildAlreadyExistsException;
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
