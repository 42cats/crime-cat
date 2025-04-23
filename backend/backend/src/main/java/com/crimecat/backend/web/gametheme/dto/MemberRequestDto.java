package com.crimecat.backend.web.gametheme.dto;

import com.crimecat.backend.exception.ErrorStatus;
import lombok.Getter;

import java.util.UUID;

@Getter
public class MemberRequestDto {
    private UUID userId;
    private String name;

    public void validate() {
        // userId나 name 둘 중 하나는 값이 존재해야 함
        if (userId == null && (name == null || name.isBlank())) {
            throw ErrorStatus.INVALID_INPUT.asDomainException();
        }
    }
}
