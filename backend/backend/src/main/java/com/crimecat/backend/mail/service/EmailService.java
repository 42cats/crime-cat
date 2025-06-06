package com.crimecat.backend.mail.service;

import com.crimecat.backend.mail.dto.EmailRequestDto;
import com.crimecat.backend.mail.dto.EmailResponseDto;

import java.util.Map;

public interface EmailService {
    
    /**
     * 단순 텍스트 메일 발송
     */
    EmailResponseDto sendSimpleEmail(String to, String subject, String content);
    
    /**
     * HTML 메일 발송
     */
    EmailResponseDto sendHtmlEmail(String to, String subject, String htmlContent);
    
    /**
     * 템플릿을 사용한 메일 발송
     */
    EmailResponseDto sendTemplateEmail(String to, String subject, String templateName, Map<String, Object> variables);
    
    /**
     * 회원가입 인증 메일 발송
     */
    EmailResponseDto sendVerificationEmail(String to, String verificationCode);
    
    /**
     * 비밀번호 재설정 메일 발송
     */
    EmailResponseDto sendPasswordResetEmail(String to, String resetToken);
    
    /**
     * 게임 결과 알림 메일 발송
     */
    EmailResponseDto sendGameResultEmail(String to, String playerName, String gameTitle, String result);
    
    /**
     * 공지사항 메일 발송
     */
    EmailResponseDto sendNotificationEmail(String to, String title, String content);
}