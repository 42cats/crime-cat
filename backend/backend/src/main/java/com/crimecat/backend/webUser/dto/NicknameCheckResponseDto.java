package com.crimecat.backend.webUser.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NicknameCheckResponseDto {
    private boolean available; // isAvailable -> available
    private String message;
}
