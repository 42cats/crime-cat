package com.crimecat.backend.guild.controller.bot;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crimecat.backend.guild.dto.bot.GuildDto;
import com.crimecat.backend.guild.dto.bot.GuildNameUpdateRequestDto;
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

    @GetMapping("/{snowflake}/public")
    public ResponseEntity<Map<String, Boolean>> getGuildPublicStatus(@PathVariable String snowflake) {
        boolean isPublic = guildService.getGuildPublicStatus(snowflake);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isPublic", isPublic);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{snowflake}/public")
    public ResponseEntity<MessageDto<Map<String, Boolean>>> toggleGuildPublicStatus(@PathVariable String snowflake) {
        boolean newStatus = guildService.toggleGuildPublicStatus(snowflake);
        Map<String, Boolean> data = new HashMap<>();
        data.put("isPublic", newStatus);
        String message = newStatus ? "공개로 설정되었습니다." : "비공개로 설정되었습니다.";
        return ResponseEntity.ok(new MessageDto<>(message, data));
    }

    @PatchMapping("/{snowflake}/name")
    public ResponseEntity<MessageDto<GuildResponseDto>> updateGuildName(
            @PathVariable String snowflake,
            @RequestBody GuildNameUpdateRequestDto requestDto) {
        GuildDto updatedGuild = guildService.updateGuildName(snowflake, requestDto.getName());
        return ResponseEntity.ok(new MessageDto<>("길드 이름이 성공적으로 업데이트되었습니다.", new GuildResponseDto(updatedGuild)));
    }
}
