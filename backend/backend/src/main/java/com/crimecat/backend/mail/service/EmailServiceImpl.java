package com.crimecat.backend.mail.service;

import com.crimecat.backend.mail.dto.EmailResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {
    
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    
    @Value("${spring.mail.username:noreply@mystery-place.com}")
    private String fromEmail;
    
    @Override
    public EmailResponseDto sendSimpleEmail(String to, String subject, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);
            
            mailSender.send(message);
            log.info("Simple email sent successfully to: {}", to);
            return EmailResponseDto.success(to, subject);
            
        } catch (Exception e) {
            log.error("Failed to send simple email to: {}, error: {}", to, e.getMessage());
            return EmailResponseDto.failure(to, subject, e.getMessage());
        }
    }
    
    @Override
    public EmailResponseDto sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("HTML email sent successfully to: {}", to);
            return EmailResponseDto.success(to, subject);
            
        } catch (MessagingException e) {
            log.error("Failed to send HTML email to: {}, error: {}", to, e.getMessage());
            return EmailResponseDto.failure(to, subject, e.getMessage());
        }
    }
    
    @Override
    public EmailResponseDto sendTemplateEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        try {
            Context context = new Context();
            context.setVariables(variables);
            
            String htmlContent = templateEngine.process(templateName, context);
            return sendHtmlEmail(to, subject, htmlContent);
            
        } catch (Exception e) {
            log.error("Failed to send template email to: {}, template: {}, error: {}", to, templateName, e.getMessage());
            return EmailResponseDto.failure(to, subject, e.getMessage());
        }
    }
    
    @Override
    public EmailResponseDto sendVerificationEmail(String to, String verificationCode) {
        Map<String, Object> variables = Map.of(
            "verificationCode", verificationCode,
            "siteName", "Mystery Place"
        );
        
        return sendTemplateEmail(to, "Mystery Place 회원가입 인증", "verification", variables);
    }
    
    @Override
    public EmailResponseDto sendPasswordResetEmail(String to, String resetToken) {
        Map<String, Object> variables = Map.of(
            "resetToken", resetToken,
            "resetUrl", "https://mystery-place.com/reset-password?token=" + resetToken,
            "siteName", "Mystery Place"
        );
        
        return sendTemplateEmail(to, "Mystery Place 비밀번호 재설정", "password-reset", variables);
    }
    
    @Override
    public EmailResponseDto sendGameResultEmail(String to, String playerName, String gameTitle, String result) {
        Map<String, Object> variables = Map.of(
            "playerName", playerName,
            "gameTitle", gameTitle,
            "result", result,
            "siteName", "Mystery Place",
            "siteUrl", "https://mystery-place.com"
        );
        
        return sendTemplateEmail(to, "게임 결과 알림 - " + gameTitle, "game-result", variables);
    }
    
    @Override
    public EmailResponseDto sendNotificationEmail(String to, String title, String content) {
        Map<String, Object> variables = Map.of(
            "title", title,
            "content", content,
            "siteName", "Mystery Place",
            "siteUrl", "https://mystery-place.com"
        );
        
        return sendTemplateEmail(to, title, "notification", variables);
    }
}