package com.crimecat.backend.guild.controller;

import com.crimecat.backend.guild.dto.ObservationDto;
import com.crimecat.backend.guild.dto.ObservationRequestDto;
import com.crimecat.backend.guild.service.GuildObservationService;
import com.crimecat.backend.guild.utils.RequestUtil;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.openapitools.jackson.nullable.JsonNullableModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/bot/guilds/{snowflake}/observation")
public class GuildObservationController {
    private final GuildObservationService guildObservationService;
    private final ObjectMapper objectMapper;

    @Autowired
    public GuildObservationController(
            GuildObservationService guildObservationService,
            ObjectMapper objectMapper) {
        this.guildObservationService = guildObservationService;
        this.objectMapper = objectMapper;
        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        objectMapper.registerModule(new JsonNullableModule());
    }

    @PatchMapping
    public ObservationDto patch(
            @PathVariable String snowflake, HttpServletRequest request) throws JsonProcessingException {
        ObservationRequestDto observationRequestDto = objectMapper.readValue(RequestUtil.getBody(request), ObservationRequestDto.class);
        return guildObservationService.patch(snowflake, observationRequestDto);
    }

    @GetMapping
    public ObservationDto get(@PathVariable String snowflake) {
        return guildObservationService.get(snowflake);
    }
}
