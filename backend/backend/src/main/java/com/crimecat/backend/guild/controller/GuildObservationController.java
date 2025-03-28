package com.crimecat.backend.guild.controller;

import com.crimecat.backend.guild.dto.MessageDto;
import com.crimecat.backend.guild.dto.ObservationDto;
import com.crimecat.backend.guild.dto.ObservationPatchRequestDto;
import com.crimecat.backend.guild.dto.ObservationPostRequestDto;
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
@RequestMapping("/v1/bot/guilds/{guildSnowflake}/observation")
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
