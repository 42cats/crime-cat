package com.crimecat.backend.mail.service;

import com.crimecat.backend.mail.dto.EmailResponseDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.thymeleaf.TemplateEngine;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
class EmailServiceTest {
    
    @MockBean
    private JavaMailSender mailSender;
    
    @MockBean
    private TemplateEngine templateEngine;
    
    @Test
    @DisplayName("단순 텍스트 메일 발송 성공")
    void sendSimpleEmail_Success() {
        // Given
        EmailService emailService = new EmailServiceImpl(mailSender, templateEngine);
        String to = "test@example.com";
        String subject = "테스트 제목";
        String content = "테스트 내용";
        
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));
        
        // When
        EmailResponseDto response = emailService.sendSimpleEmail(to, subject, content);
        
        // Then
        assertTrue(response.isSuccess());
        assertEquals("메일이 성공적으로 발송되었습니다", response.getMessage());
        assertEquals(to, response.getTo());
        assertEquals(subject, response.getSubject());
        assertNotNull(response.getSentAt());
        
        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }
    
    @Test
    @DisplayName("메일 발송 실패 시 에러 응답")
    void sendSimpleEmail_Failure() {
        // Given
        EmailService emailService = new EmailServiceImpl(mailSender, templateEngine);
        String to = "invalid-email";
        String subject = "테스트 제목";
        String content = "테스트 내용";
        
        doThrow(new RuntimeException("메일 발송 실패")).when(mailSender).send(any(SimpleMailMessage.class));
        
        // When
        EmailResponseDto response = emailService.sendSimpleEmail(to, subject, content);
        
        // Then
        assertFalse(response.isSuccess());
        assertEquals("메일 발송에 실패했습니다", response.getMessage());
        assertEquals(to, response.getTo());
        assertEquals(subject, response.getSubject());
        assertEquals("메일 발송 실패", response.getErrorMessage());
        assertNotNull(response.getSentAt());
    }
    
    @Test
    @DisplayName("템플릿 메일 발송")
    void sendTemplateEmail_Success() {
        // Given
        EmailService emailService = new EmailServiceImpl(mailSender, templateEngine);
        String to = "test@example.com";
        String subject = "템플릿 테스트";
        String templateName = "verification";
        Map<String, Object> variables = Map.of(
            "verificationCode", "123456",
            "siteName", "Mystery Place"
        );
        
        when(templateEngine.process(eq(templateName), any(org.thymeleaf.context.Context.class))).thenReturn("<html>테스트 HTML</html>");
        doNothing().when(mailSender).send(any());
        
        // When
        EmailResponseDto response = emailService.sendTemplateEmail(to, subject, templateName, variables);
        
        // Then
        assertTrue(response.isSuccess());
        assertEquals(to, response.getTo());
        assertEquals(subject, response.getSubject());
        
        verify(templateEngine, times(1)).process(eq(templateName), any(org.thymeleaf.context.Context.class));
    }
    
    @Test
    @DisplayName("회원가입 인증 메일 발송")
    void sendVerificationEmail_Success() {
        // Given
        EmailService emailService = new EmailServiceImpl(mailSender, templateEngine);
        String to = "test@example.com";
        String verificationCode = "123456";
        
        when(templateEngine.process(eq("verification"), any(org.thymeleaf.context.Context.class))).thenReturn("<html>인증 메일</html>");
        doNothing().when(mailSender).send(any());
        
        // When
        EmailResponseDto response = emailService.sendVerificationEmail(to, verificationCode);
        
        // Then
        assertTrue(response.isSuccess());
        assertEquals(to, response.getTo());
        assertEquals("Mystery Place 회원가입 인증", response.getSubject());
    }
    
    @Test
    @DisplayName("비밀번호 재설정 메일 발송")
    void sendPasswordResetEmail_Success() {
        // Given
        EmailService emailService = new EmailServiceImpl(mailSender, templateEngine);
        String to = "test@example.com";
        String resetToken = "reset-token-123";
        
        when(templateEngine.process(eq("password-reset"), any(org.thymeleaf.context.Context.class))).thenReturn("<html>비밀번호 재설정</html>");
        doNothing().when(mailSender).send(any());
        
        // When
        EmailResponseDto response = emailService.sendPasswordResetEmail(to, resetToken);
        
        // Then
        assertTrue(response.isSuccess());
        assertEquals(to, response.getTo());
        assertEquals("Mystery Place 비밀번호 재설정", response.getSubject());
    }
    
    @Test
    @DisplayName("게임 결과 알림 메일 발송")
    void sendGameResultEmail_Success() {
        // Given
        EmailService emailService = new EmailServiceImpl(mailSender, templateEngine);
        String to = "test@example.com";
        String playerName = "테스트플레이어";
        String gameTitle = "미스터리 게임";
        String result = "클리어!";
        
        when(templateEngine.process(eq("game-result"), any(org.thymeleaf.context.Context.class))).thenReturn("<html>게임 결과</html>");
        doNothing().when(mailSender).send(any());
        
        // When
        EmailResponseDto response = emailService.sendGameResultEmail(to, playerName, gameTitle, result);
        
        // Then
        assertTrue(response.isSuccess());
        assertEquals(to, response.getTo());
        assertEquals("게임 결과 알림 - " + gameTitle, response.getSubject());
    }
}