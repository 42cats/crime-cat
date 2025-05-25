package com.crimecat.backend.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 단순 메시지 응답 DTO
 * API에서 간단한 문자열 메시지를 전달하기 위한 공통 포맷
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponseDto {
    private String message;
}
