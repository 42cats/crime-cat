package com.crimecat.backend.coupon.dto;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MessageDto<T> {
    private String message;

    @JsonUnwrapped
    private T innerDto;

    public MessageDto(String message, T innerDto) {
        this.message = message;
        this.innerDto = innerDto;
    }

    public MessageDto(String message) {
        this(message,null);
    }
}
