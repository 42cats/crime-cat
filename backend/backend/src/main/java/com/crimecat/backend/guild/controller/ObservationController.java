package com.crimecat.backend.guild.controller;

import com.crimecat.backend.guild.domain.Observation;
import com.crimecat.backend.guild.dto.ObservationDto;
import com.crimecat.backend.guild.dto.ObservationRequestDto;
import com.crimecat.backend.guild.service.ObservationService;
import com.crimecat.backend.guild.utils.RequestUtil;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.openapitools.jackson.nullable.JsonNullableModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/bot/guilds/{guildSnowflake}/observation")
public class ObservationController {
    private final ObservationService observationService;
    private final ObjectMapper objectMapper;

    @Autowired
    public ObservationController(
            ObservationService observationService,
            ObjectMapper objectMapper) {
        this.observationService = observationService;
        this.objectMapper = objectMapper;
        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        objectMapper.registerModule(new JsonNullableModule());
    }

    @PatchMapping
    public ObservationDto patch(
            @PathVariable String guildSnowflake, HttpServletRequest request) throws JsonProcessingException {
        System.out.println("guild snowflake::: " + guildSnowflake);
        ObservationRequestDto observationRequestDto = objectMapper.readValue(RequestUtil.getBody(request), ObservationRequestDto.class);
        return observationService.patch(guildSnowflake, observationRequestDto);
    }

    @GetMapping
    public ObservationDto get(@PathVariable String guildSnowflake) {
        return observationService.get(guildSnowflake);
    }
}
