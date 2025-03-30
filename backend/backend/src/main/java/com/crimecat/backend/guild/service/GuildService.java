package com.crimecat.backend.guild.service;

import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.dto.GuildDto;
import com.crimecat.backend.guild.dto.GuildResponseDto;
import com.crimecat.backend.guild.dto.MessageDto;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.user.service.UserQueryService;
import lombok.RequiredArgsConstructor;
import org.aspectj.bridge.Message;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class GuildService {
    private final GuildRepository guildRepository;
    private final UserQueryService userQueryService;

    // TODO: MessageDto 안 쓰고 생성과 복구를 구별할 방법?

    /**
     * 길드 생성
     * @param guildDto 생성할 길드 정보 (snowflake, name, owner snowflake)
     * @return 길드 생성 정보 반환 MessageDto
     */
    public MessageDto<GuildResponseDto> addGuild(GuildDto guildDto) {
        if (userQueryService.findByUserSnowflake(guildDto.getOwnerSnowflake()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No user");
        }
        Guild guild = guildRepository.findBySnowflake(guildDto.getSnowflake()).orElse(null);
        if (guild != null) {
            if (!guild.isWithdraw()) {
                // TODO: use throw to handle error
                return null;
            }
            guild.setIsWithdraw(false);
            guildRepository.save(guild);
            return new MessageDto<>("Guild restored successfully", new GuildResponseDto(new GuildDto(guild)));
        }
        guild = Guild.of(guildDto);
        guildRepository.save(guild);
        return new MessageDto<>("Guild created successfully", new GuildResponseDto(new GuildDto(guild)));
    }

    /**
     * 길드 삭제
     * @param snowflake 삭제할 길드 snowflake
     */
    public void deleteGuild(String snowflake) {
        Guild guild = guildRepository.findBySnowflake(snowflake).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guild not found")
        );
        if (guild.isWithdraw()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guild already deleted");
        }
        guild.setIsWithdraw(true);
        guildRepository.save(guild);
    }
}
