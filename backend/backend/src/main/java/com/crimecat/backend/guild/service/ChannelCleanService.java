package com.crimecat.backend.guild.service;

import com.crimecat.backend.guild.domain.Clean;
import com.crimecat.backend.guild.dto.ChannelCleanDto;
import com.crimecat.backend.guild.dto.ChannelCleanListDto;
import com.crimecat.backend.guild.repository.ChannelCleanRepository;
import com.crimecat.backend.guild.repository.GuildRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ChannelCleanService {
    private final ChannelCleanRepository channelCleanRepository;
    private final GuildRepository guildRepository;

    public ChannelCleanListDto getCleans(String guildSnowflake) {
        return new ChannelCleanListDto(guildSnowflake,
                channelCleanRepository.findByGuildSnowflake(guildSnowflake).stream()
                        .map(Clean::getChannelSnowflake)
                        .toList()
        );
    }

    public ChannelCleanListDto addCleanChannel(String guildSnowflake, String channelSnowflake) {
        List<Clean> cleans = channelCleanRepository.findByGuildSnowflake(guildSnowflake);
        if (cleans.stream().noneMatch(v -> v.getChannelSnowflake().equals(channelSnowflake))) {
            Clean clean = new Clean(channelSnowflake, guildSnowflake);
            channelCleanRepository.save(clean);
            cleans = new ArrayList<>(cleans);
            cleans.add(clean);
        }
        return new ChannelCleanListDto(guildSnowflake, cleans.stream().map(Clean::getChannelSnowflake).toList());
    }

    public ChannelCleanDto deleteClean(String guildSnowflake, String channelSnowflake) {
        if (channelCleanRepository.deleteByGuildSnowflakeAndChannelSnowflake(guildSnowflake,
                channelSnowflake) == 0) {
            throw new RuntimeException();
        }
        return new ChannelCleanDto(guildSnowflake, channelSnowflake);
    }
}
