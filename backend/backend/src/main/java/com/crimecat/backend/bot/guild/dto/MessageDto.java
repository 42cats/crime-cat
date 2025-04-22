package com.crimecat.backend.bot.guild.dto;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import lombok.Getter;

@Getter
public class MessageDto<T> {
    private String message;

    @JsonUnwrapped
    private T innerDto;

    public MessageDto(String message, T innerDto) {
        this.message = message;
        this.innerDto = innerDto;
    }

    public MessageDto(String message) {
        this(message, null);
    }
}
