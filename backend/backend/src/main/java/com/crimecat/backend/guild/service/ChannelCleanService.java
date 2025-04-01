package com.crimecat.backend.guild.service;

import com.crimecat.backend.guild.domain.Clean;
import com.crimecat.backend.guild.dto.ChannelCleanDto;
import com.crimecat.backend.guild.dto.ChannelCleanListDto;
import com.crimecat.backend.guild.repository.ChannelCleanRepository;
import com.crimecat.backend.guild.repository.GuildRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ChannelCleanService {
    private final ChannelCleanRepository channelCleanRepository;
    private final GuildQueryService guildQueryService;

    public ChannelCleanListDto getCleans(String guildSnowflake) {
        if (!guildQueryService.existsBySnowflake(guildSnowflake)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "guild not exists");
        }
        return new ChannelCleanListDto(guildSnowflake,
                channelCleanRepository.findByGuildSnowflake(guildSnowflake).stream()
                        .map(Clean::getChannelSnowflake)
                        .toList()
        );
    }

    public ChannelCleanListDto addCleanChannel(String guildSnowflake, String channelSnowflake) {
        if (!guildQueryService.existsBySnowflake(guildSnowflake)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "guild not exists");
        }
        List<Clean> cleans = channelCleanRepository.findByGuildSnowflake(guildSnowflake);
        if (cleans.stream().anyMatch(v -> v.getChannelSnowflake().equals(channelSnowflake))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "duplicated channel snowflake");
        }
        Clean clean = new Clean(channelSnowflake, guildSnowflake);
        channelCleanRepository.save(clean);
        cleans = new ArrayList<>(cleans);
        cleans.add(clean);
        return new ChannelCleanListDto(guildSnowflake, cleans.stream().map(Clean::getChannelSnowflake).toList());
    }

    @Transactional
    public ChannelCleanDto deleteClean(String guildSnowflake, String channelSnowflake) {
        if (channelCleanRepository.deleteByGuildSnowflakeAndChannelSnowflake(guildSnowflake,
                channelSnowflake) == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "channel not deleted");
        }
        return new ChannelCleanDto(guildSnowflake, channelSnowflake);
    }
}
