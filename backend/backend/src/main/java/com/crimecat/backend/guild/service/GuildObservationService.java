package com.crimecat.backend.guild.service;

import com.crimecat.backend.guild.domain.Observation;
import com.crimecat.backend.guild.dto.ObservationDto;
import com.crimecat.backend.guild.dto.ObservationPatchRequestDto;
import com.crimecat.backend.guild.repository.GuildObservationRepository;
import com.crimecat.backend.guild.repository.GuildRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class GuildObservationService {
    private final GuildObservationRepository guildObservationRepository;
    private final GuildQueryService guildQueryService;

    /**
     * 관전 정보 부분 업데이트
     * @param guildSnowflake 관전 정보를 변경하고자 하는 길드의 snowflake
     * @param observationPatchRequestDto 관전 정보
     * @return 업데이트된 관전 정보 dto
     */
    public ObservationDto patchObservation(String guildSnowflake,
                                           ObservationPatchRequestDto observationPatchRequestDto) {
        Observation observation = guildObservationRepository.findByGuildSnowflake(guildSnowflake)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guild observation not exists"));
        observation.setHeadTitle(observationPatchRequestDto.getHeadTitle());
        observation.setRoleSnowflake(observationPatchRequestDto.getRoleSnowFlake());
        guildObservationRepository.save(observation);
        return new ObservationDto(guildSnowflake, observation.getHeadTitle(), observation.getRoleSnowflake());
    }

    /**
     * 관전 정보 조회
     * @param guildSnowflake 관전 정보를 조회하고자 하는 길드의 snowflake
     * @return 관전 정보 dto
     */
    public ObservationDto getObservation(String guildSnowflake) {
        Observation observation = guildObservationRepository.findByGuildSnowflake(guildSnowflake)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guild observation not exists"));
        return new ObservationDto(observation);
    }

    /**
     * 관전 정보 생성
     * @param guildSnowflake 관전 정보를 생성하고자 하는 길드의 snowflake
     * @param roleSnowflake 관전자 디스코드 role snowflake
     * @param headTitle 관전자 이름에 붙은 prefix
     * @return
     */
    public ObservationDto addObservation(String guildSnowflake, String roleSnowflake, String headTitle) {
        Observation observation = guildObservationRepository.findByGuildSnowflake(guildSnowflake).orElse(null);
        if (observation != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guild Observation information already exists");
        }
        if (!guildQueryService.existsBySnowflake(guildSnowflake)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guild not exists");
        }
        observation = new Observation(guildSnowflake, roleSnowflake, headTitle);
        return new ObservationDto(guildObservationRepository.save(observation));
    }
}
