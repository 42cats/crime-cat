package com.crimecat.backend.bot.guild.service;

import com.crimecat.backend.bot.guild.domain.Guild;
import com.crimecat.backend.bot.guild.dto.GuildDto;
import com.crimecat.backend.bot.guild.dto.GuildResponseDto;
import com.crimecat.backend.bot.guild.dto.MessageDto;
import com.crimecat.backend.bot.guild.exception.GuildAlreadyExistsException;
import com.crimecat.backend.bot.guild.repository.GuildRepository;
import com.crimecat.backend.bot.user.domain.User;
import com.crimecat.backend.bot.user.repository.UserRepository;
import com.crimecat.backend.exception.ErrorStatus;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class GuildService {
    private final GuildRepository guildRepository;
    private final UserRepository userRepository;

    // TODO: MessageDto 안 쓰고 생성과 복구를 구별할 방법?

    /**
     * 길드 생성
     * @param guildDto 생성할 길드 정보 (snowflake, name, owner snowflake)
     * @return 길드 생성 정보 반환 MessageDto
     */
    @Transactional
    public MessageDto<GuildResponseDto> addGuild(GuildDto guildDto) {
        User user = userRepository.findByDiscordSnowflake(guildDto.getOwnerSnowflake()).orElseThrow(
            ErrorStatus.USER_NOT_FOUND::asServiceException);
        Guild guild = guildRepository.findBySnowflake(guildDto.getSnowflake()).orElse(null);
        if (guild != null) {
            if (!guild.isWithdraw()) {
                // TODO: use throw to handle error
                throw new GuildAlreadyExistsException(new GuildDto(guild));
            }
            guild.setIsWithdraw(false);
            guildRepository.save(guild);
            return new MessageDto<>("Guild restored successfully", new GuildResponseDto(new GuildDto(guild)));
        }
        guild = Guild.of(guildDto,user);
        guildRepository.save(guild);
        return new MessageDto<>("Guild created successfully", new GuildResponseDto(new GuildDto(guild)));
    }

    /**
     * 길드 삭제
     * @param snowflake 삭제할 길드 snowflake
     */
    @Transactional
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

    /*
		gameHistory 저장 확인용 임시 메서드
	 */
    @Transactional
    public Guild findGuildByGuildSnowflake(String guildSnowflake) {
        return guildRepository.findGuildByGuildSnowflake(guildSnowflake).orElse(null);
    }

    @Transactional
    public List<Guild> findGuildByOwnerId(String ownerSnowFlake){
        return guildRepository.findActiveGuildsByOwner(ownerSnowFlake);
    }

    @Transactional
    public List<Guild> findAllGuild(){
        return guildRepository.findAllActiveGuilds();
    }
}
