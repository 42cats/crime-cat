package com.crimecat.backend.guild.controller;

import com.crimecat.backend.guild.dto.GuildDto;
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
    public ResponseEntity<?> addGuild(@RequestBody GuildDto guildDto) {
        GuildDto guildResponseDto = guildService.addGuild(guildDto);
        if (guildResponseDto == null) {
            // TODO: use exception to handle error
            return new ResponseEntity<>(guildDto, HttpStatus.BAD_REQUEST);
        }
        return new ResponseEntity<>(guildResponseDto, HttpStatus.OK);
    }

    @DeleteMapping("/{snowflake}")
    public MessageDto<?> deleteGuild(@PathVariable String snowflake) {
        try {
            guildService.deleteGuild(snowflake);
        } catch (Exception e) {
            // TODO: make custom exception
            return new MessageDto<>("Guild not found");
        }
        return new MessageDto<>("Guild deleted successfully");
    }


}
