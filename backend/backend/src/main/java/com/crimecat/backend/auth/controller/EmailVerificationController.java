package com.crimecat.backend.auth.controller;

import com.crimecat.backend.auth.service.EmailVerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth/email")
@RequiredArgsConstructor
@Tag(name = "Email Verification", description = "이메일 인증 API")
public class EmailVerificationController {
    
    private final EmailVerificationService emailVerificationService;
    
    @PostMapping("/send-verification")
    @Operation(summary = "이메일 인증 코드 발송", description = "회원가입용 이메일 인증 코드를 발송합니다")
    public ResponseEntity<Map<String, Object>> sendVerificationCode(
            @RequestParam @Email @NotBlank String email) {
        
        log.info("Verification code request for email: {}", email);
        
        boolean success = emailVerificationService.sendVerificationCode(email);
        
        if (success) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "인증 코드가 이메일로 발송되었습니다.",
                "email", email
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "인증 코드 발송에 실패했습니다.",
                "email", email
            ));
        }
    }
    
    @PostMapping("/verify-code")
    @Operation(summary = "이메일 인증 코드 검증", description = "발송된 인증 코드를 검증합니다")
    public ResponseEntity<Map<String, Object>> verifyCode(
            @RequestParam @Email @NotBlank String email,
            @RequestParam @NotBlank String code) {
        
        log.info("Verification code verification for email: {}, code: {}", email, code);
        
        boolean isValid = emailVerificationService.verifyCode(email, code);
        
        if (isValid) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "이메일 인증이 완료되었습니다.",
                "email", email
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "인증 코드가 올바르지 않거나 만료되었습니다.",
                "email", email
            ));
        }
    }
    
    @PostMapping("/send-password-reset")
    @Operation(summary = "비밀번호 재설정 토큰 발송", description = "비밀번호 재설정용 토큰을 이메일로 발송합니다")
    public ResponseEntity<Map<String, Object>> sendPasswordResetToken(
            @RequestParam @Email @NotBlank String email) {
        
        log.info("Password reset token request for email: {}", email);
        
        boolean success = emailVerificationService.sendPasswordResetToken(email);
        
        if (success) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "비밀번호 재설정 링크가 이메일로 발송되었습니다.",
                "email", email
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "비밀번호 재설정 링크 발송에 실패했습니다.",
                "email", email
            ));
        }
    }
    
    @PostMapping("/verify-reset-token")
    @Operation(summary = "비밀번호 재설정 토큰 검증", description = "비밀번호 재설정 토큰을 검증합니다")
    public ResponseEntity<Map<String, Object>> verifyPasswordResetToken(
            @RequestParam @Email @NotBlank String email,
            @RequestParam @NotBlank String token) {
        
        log.info("Password reset token verification for email: {}", email);
        
        boolean isValid = emailVerificationService.verifyPasswordResetToken(email, token);
        
        if (isValid) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "토큰이 유효합니다. 새 비밀번호를 설정해주세요.",
                "email", email
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "토큰이 올바르지 않거나 만료되었습니다.",
                "email", email
            ));
        }
    }
    
    @PostMapping("/send-game-result")
    @Operation(summary = "게임 결과 알림 메일 발송", description = "게임 완료 후 결과를 이메일로 발송합니다")
    public ResponseEntity<Map<String, Object>> sendGameResultNotification(
            @RequestParam @Email @NotBlank String email,
            @RequestParam @NotBlank String playerName,
            @RequestParam @NotBlank String gameTitle,
            @RequestParam @NotBlank String result) {
        
        log.info("Game result notification request for email: {}, game: {}", email, gameTitle);
        
        boolean success = emailVerificationService.sendGameResultNotification(email, playerName, gameTitle, result);
        
        if (success) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "게임 결과 알림이 이메일로 발송되었습니다.",
                "email", email
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "게임 결과 알림 발송에 실패했습니다.",
                "email", email
            ));
        }
    }
}