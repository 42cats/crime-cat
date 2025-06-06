package com.crimecat.backend.mail.controller;

import com.crimecat.backend.mail.dto.EmailRequestDto;
import com.crimecat.backend.mail.dto.EmailResponseDto;
import com.crimecat.backend.mail.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/email")
@RequiredArgsConstructor
public class EmailController {
    
    private final EmailService emailService;
    
    @PostMapping("/send/simple")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailResponseDto> sendSimpleEmail(@Valid @RequestBody EmailRequestDto request) {
        log.info("Simple email request: to={}, subject={}", request.getTo(), request.getSubject());
        
        EmailResponseDto response = emailService.sendSimpleEmail(
            request.getTo(),
            request.getSubject(),
            request.getContent()
        );
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/send/html")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailResponseDto> sendHtmlEmail(@Valid @RequestBody EmailRequestDto request) {
        log.info("HTML email request: to={}, subject={}", request.getTo(), request.getSubject());
        
        EmailResponseDto response = emailService.sendHtmlEmail(
            request.getTo(),
            request.getSubject(),
            request.getContent()
        );
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/send/template")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailResponseDto> sendTemplateEmail(@Valid @RequestBody EmailRequestDto request) {
        log.info("Template email request: to={}, subject={}, template={}", 
                request.getTo(), request.getSubject(), request.getTemplateName());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> variables = (Map<String, Object>) request.getTemplateVariables();
        
        EmailResponseDto response = emailService.sendTemplateEmail(
            request.getTo(),
            request.getSubject(),
            request.getTemplateName(),
            variables
        );
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/send/verification")
    public ResponseEntity<EmailResponseDto> sendVerificationEmail(
            @RequestParam String to,
            @RequestParam String verificationCode) {
        
        log.info("Verification email request: to={}, code={}", to, verificationCode);
        
        EmailResponseDto response = emailService.sendVerificationEmail(to, verificationCode);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/send/password-reset")
    public ResponseEntity<EmailResponseDto> sendPasswordResetEmail(
            @RequestParam String to,
            @RequestParam String resetToken) {
        
        log.info("Password reset email request: to={}, token={}", to, resetToken);
        
        EmailResponseDto response = emailService.sendPasswordResetEmail(to, resetToken);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/send/game-result")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<EmailResponseDto> sendGameResultEmail(
            @RequestParam String to,
            @RequestParam String playerName,
            @RequestParam String gameTitle,
            @RequestParam String result) {
        
        log.info("Game result email request: to={}, player={}, game={}", to, playerName, gameTitle);
        
        EmailResponseDto response = emailService.sendGameResultEmail(to, playerName, gameTitle, result);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/send/notification")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailResponseDto> sendNotificationEmail(
            @RequestParam String to,
            @RequestParam String title,
            @RequestParam String content) {
        
        log.info("Notification email request: to={}, title={}", to, title);
        
        EmailResponseDto response = emailService.sendNotificationEmail(to, title, content);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailResponseDto> testEmail(@RequestParam String to) {
        log.info("Test email request: to={}", to);
        
        EmailResponseDto response = emailService.sendSimpleEmail(
            to,
            "Mystery Place 메일 테스트",
            "메일 발송 기능이 정상적으로 작동합니다! 🎉"
        );
        
        return ResponseEntity.ok(response);
    }
}