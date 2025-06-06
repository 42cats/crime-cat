package com.crimecat.backend.mail.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailResponseDto {
    
    private boolean success;
    private String message;
    private String to;
    private String subject;
    private LocalDateTime sentAt;
    private String errorMessage;
    
    public static EmailResponseDto success(String to, String subject) {
        return EmailResponseDto.builder()
                .success(true)
                .message("메일이 성공적으로 발송되었습니다")
                .to(to)
                .subject(subject)
                .sentAt(LocalDateTime.now())
                .build();
    }
    
    public static EmailResponseDto failure(String to, String subject, String errorMessage) {
        return EmailResponseDto.builder()
                .success(false)
                .message("메일 발송에 실패했습니다")
                .to(to)
                .subject(subject)
                .errorMessage(errorMessage)
                .sentAt(LocalDateTime.now())
                .build();
    }
}