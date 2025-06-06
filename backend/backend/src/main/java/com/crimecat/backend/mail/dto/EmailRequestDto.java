package com.crimecat.backend.mail.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailRequestDto {
    
    @Email(message = "올바른 이메일 형식이어야 합니다")
    @NotBlank(message = "수신자 이메일은 필수입니다")
    private String to;
    
    @NotBlank(message = "제목은 필수입니다")
    private String subject;
    
    @NotBlank(message = "내용은 필수입니다")
    private String content;
    
    private String templateName;
    
    private Object templateVariables;
}