package com.crimecat.backend.bot.guild.controller;

import org.openapitools.jackson.nullable.JsonNullableModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crimecat.backend.bot.guild.dto.MessageDto;
import com.crimecat.backend.bot.guild.dto.ObservationDto;
import com.crimecat.backend.bot.guild.dto.ObservationPatchRequestDto;
import com.crimecat.backend.bot.guild.dto.ObservationPostRequestDto;
import com.crimecat.backend.bot.guild.service.GuildObservationService;
import com.crimecat.backend.bot.guild.utils.RequestUtil;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/bot/v1/guilds/{guildSnowflake}/observation")
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

    @PostMapping
    public MessageDto<ObservationDto> postObservation(@PathVariable String guildSnowflake,
                                              @RequestBody ObservationPostRequestDto observationPostRequestDto) {
        ObservationDto observationDto = guildObservationService.addObservation(guildSnowflake,
                observationPostRequestDto.getRoleSnowflake(),
                observationPostRequestDto.getHeadTitle());
        return new MessageDto<>("Observer role created successfully", observationDto);
    }

    @PatchMapping
    public MessageDto<ObservationDto> patchObservation(
            @PathVariable String guildSnowflake, HttpServletRequest request) throws JsonProcessingException {
        ObservationPatchRequestDto observationPatchRequestDto
                = objectMapper.readValue(RequestUtil.getBody(request), ObservationPatchRequestDto.class);
        return new MessageDto<>("Observer role edited successfully",
                guildObservationService.patchObservation(guildSnowflake, observationPatchRequestDto));
    }

    @GetMapping
    public MessageDto<ObservationDto> getObservation(@PathVariable String guildSnowflake) {
        return new MessageDto<>("Observer role found successfully",
                guildObservationService.getObservation(guildSnowflake));
    }
}
