package com.crimecat.backend.guild.service;

import com.crimecat.backend.guild.domain.Observation;
import com.crimecat.backend.guild.dto.ObservationDto;
import com.crimecat.backend.guild.dto.ObservationRequestDto;
import com.crimecat.backend.guild.repository.GuildObservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class GuildObservationService {
    private final GuildObservationRepository guildObservationRepository;

    public ObservationDto patch(String guildSnowflake, ObservationRequestDto observationRequestDto) {
        Observation observation = guildObservationRepository.findByGuildSnowflake(guildSnowflake)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guild not exists"));
        observation.setHeadTitle(observationRequestDto.getHeadTitle());
        observation.setRoleSnowflake(observationRequestDto.getRoleSnowFlake());
        guildObservationRepository.save(observation);
        return new ObservationDto(guildSnowflake, observation.getHeadTitle(), observation.getRoleSnowflake());
    }

    public ObservationDto get(String guildSnowflake) {
        Observation observation = guildObservationRepository.findByGuildSnowflake(guildSnowflake)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guild not exists"));
        return new ObservationDto(observation);
    }
}
