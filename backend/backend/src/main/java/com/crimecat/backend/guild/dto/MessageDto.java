package com.crimecat.backend.guild.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonUnwrapped;

public class MessageDto<T> {
    private String message;
    @JsonInclude(JsonInclude.Include.NON_NULL)
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
