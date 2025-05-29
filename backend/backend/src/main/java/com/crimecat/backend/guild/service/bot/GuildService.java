package com.crimecat.backend.guild.service.bot;

import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.dto.bot.GuildDto;
import com.crimecat.backend.guild.dto.bot.GuildResponseDto;
import com.crimecat.backend.guild.dto.bot.MessageDto;
import com.crimecat.backend.guild.exception.GuildAlreadyExistsException;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
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

    /**
     * 길드의 공개 상태 조회
     * @param snowflake 길드 snowflake
     * @return 공개 여부 (true: 공개, false: 비공개)
     */
    @Transactional(readOnly = true)
    public boolean getGuildPublicStatus(String snowflake) {
        Guild guild = guildRepository.findBySnowflake(snowflake).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guild not found")
        );
        return guild.getIsPublic();
    }

    /**
     * 길드의 공개 상태 토글
     * @param snowflake 길드 snowflake
     * @return 변경된 공개 상태 (true: 공개, false: 비공개)
     */
    @Transactional
    public boolean toggleGuildPublicStatus(String snowflake) {
        Guild guild = guildRepository.findBySnowflake(snowflake).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guild not found")
        );
        boolean newStatus = !guild.getIsPublic();
        guild.setIsPublic(newStatus);
        guildRepository.save(guild);
        return newStatus;
    }

    /**
     * 길드 이름 업데이트
     * @param snowflake 길드 snowflake
     * @param name 새로운 길드 이름
     * @return 업데이트된 길드 정보
     */
    @Transactional
    public GuildDto updateGuildName(String snowflake, String name) {
        Guild guild = guildRepository.findBySnowflake(snowflake).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guild not found")
        );
        guild.setName(name);
        guildRepository.save(guild);
        return new GuildDto(guild);
    }
}
