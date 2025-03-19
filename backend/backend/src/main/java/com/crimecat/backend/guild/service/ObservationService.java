package com.crimecat.backend.guild.service;

import com.crimecat.backend.guild.domain.Observation;
import com.crimecat.backend.guild.dto.ObservationDto;
import com.crimecat.backend.guild.dto.ObservationRequestDto;
import com.crimecat.backend.guild.repository.ObservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ObservationService {
    private final ObservationRepository observationRepository;

    public ObservationDto patch(String guildSnowflake, ObservationRequestDto observationRequestDto) {
        Observation observation = observationRepository.findByGuildSnowflake(guildSnowflake)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guild not exists"));
        observation.setHeadTitle(observationRequestDto.getHeadTitle());
        observation.setRoleSnowflake(observationRequestDto.getRoleSnowFlake());
        observationRepository.save(observation);
        return new ObservationDto(guildSnowflake, observation.getHeadTitle(), observation.getRoleSnowflake());
    }

    public ObservationDto get(String guildSnowflake) {
        Observation observation = observationRepository.findByGuildSnowflake(guildSnowflake)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guild not exists"));
        return new ObservationDto(observation);
    }
}
