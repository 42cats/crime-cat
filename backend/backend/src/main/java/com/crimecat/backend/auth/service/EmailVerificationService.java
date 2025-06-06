package com.crimecat.backend.auth.service;

import com.crimecat.backend.mail.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationService {
    
    private final EmailService emailService;
    private final RedisTemplate<String, String> redisTemplate;
    
    private static final String VERIFICATION_PREFIX = "email_verification:";
    private static final String PASSWORD_RESET_PREFIX = "password_reset:";
    private static final int CODE_LENGTH = 6;
    private static final Duration VERIFICATION_EXPIRE_TIME = Duration.ofMinutes(10);
    private static final Duration PASSWORD_RESET_EXPIRE_TIME = Duration.ofMinutes(30);
    
    /**
     * 이메일 인증 코드 생성 및 발송
     */
    public boolean sendVerificationCode(String email) {
        try {
            String verificationCode = generateRandomCode();
            
            // Redis에 인증 코드 저장
            String key = VERIFICATION_PREFIX + email;
            redisTemplate.opsForValue().set(key, verificationCode, VERIFICATION_EXPIRE_TIME);
            
            // 인증 메일 발송
            var response = emailService.sendVerificationEmail(email, verificationCode);
            
            if (response.isSuccess()) {
                log.info("Verification code sent successfully to: {}", email);
                return true;
            } else {
                log.error("Failed to send verification email to: {}, error: {}", email, response.getErrorMessage());
                return false;
            }
            
        } catch (Exception e) {
            log.error("Error sending verification code to: {}, error: {}", email, e.getMessage());
            return false;
        }
    }
    
    /**
     * 이메일 인증 코드 검증
     */
    public boolean verifyCode(String email, String inputCode) {
        try {
            String key = VERIFICATION_PREFIX + email;
            String storedCode = redisTemplate.opsForValue().get(key);
            
            if (storedCode == null) {
                log.warn("Verification code not found or expired for email: {}", email);
                return false;
            }
            
            boolean isValid = storedCode.equals(inputCode);
            
            if (isValid) {
                // 인증 성공 시 코드 삭제
                redisTemplate.delete(key);
                log.info("Email verification successful for: {}", email);
            } else {
                log.warn("Invalid verification code for email: {}", email);
            }
            
            return isValid;
            
        } catch (Exception e) {
            log.error("Error verifying code for email: {}, error: {}", email, e.getMessage());
            return false;
        }
    }
    
    /**
     * 비밀번호 재설정 토큰 생성 및 발송
     */
    public boolean sendPasswordResetToken(String email) {
        try {
            String resetToken = generateResetToken();
            
            // Redis에 재설정 토큰 저장
            String key = PASSWORD_RESET_PREFIX + email;
            redisTemplate.opsForValue().set(key, resetToken, PASSWORD_RESET_EXPIRE_TIME);
            
            // 비밀번호 재설정 메일 발송
            var response = emailService.sendPasswordResetEmail(email, resetToken);
            
            if (response.isSuccess()) {
                log.info("Password reset token sent successfully to: {}", email);
                return true;
            } else {
                log.error("Failed to send password reset email to: {}, error: {}", email, response.getErrorMessage());
                return false;
            }
            
        } catch (Exception e) {
            log.error("Error sending password reset token to: {}, error: {}", email, e.getMessage());
            return false;
        }
    }
    
    /**
     * 비밀번호 재설정 토큰 검증
     */
    public boolean verifyPasswordResetToken(String email, String token) {
        try {
            String key = PASSWORD_RESET_PREFIX + email;
            String storedToken = redisTemplate.opsForValue().get(key);
            
            if (storedToken == null) {
                log.warn("Password reset token not found or expired for email: {}", email);
                return false;
            }
            
            boolean isValid = storedToken.equals(token);
            
            if (isValid) {
                // 토큰 검증 성공 시 삭제
                redisTemplate.delete(key);
                log.info("Password reset token verification successful for: {}", email);
            } else {
                log.warn("Invalid password reset token for email: {}", email);
            }
            
            return isValid;
            
        } catch (Exception e) {
            log.error("Error verifying password reset token for email: {}, error: {}", email, e.getMessage());
            return false;
        }
    }
    
    /**
     * 게임 결과 알림 메일 발송
     */
    public boolean sendGameResultNotification(String email, String playerName, String gameTitle, String result) {
        try {
            var response = emailService.sendGameResultEmail(email, playerName, gameTitle, result);
            
            if (response.isSuccess()) {
                log.info("Game result notification sent successfully to: {}", email);
                return true;
            } else {
                log.error("Failed to send game result notification to: {}, error: {}", email, response.getErrorMessage());
                return false;
            }
            
        } catch (Exception e) {
            log.error("Error sending game result notification to: {}, error: {}", email, e.getMessage());
            return false;
        }
    }
    
    /**
     * 6자리 랜덤 인증 코드 생성
     */
    private String generateRandomCode() {
        SecureRandom random = new SecureRandom();
        StringBuilder code = new StringBuilder();
        
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(random.nextInt(10));
        }
        
        return code.toString();
    }
    
    /**
     * 32자리 랜덤 토큰 생성
     */
    private String generateResetToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[24];
        random.nextBytes(bytes);
        
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    
    /**
     * 특정 이메일의 인증 코드 삭제
     */
    public void deleteVerificationCode(String email) {
        String key = VERIFICATION_PREFIX + email;
        redisTemplate.delete(key);
        log.info("Verification code deleted for email: {}", email);
    }
    
    /**
     * 특정 이메일의 재설정 토큰 삭제
     */
    public void deletePasswordResetToken(String email) {
        String key = PASSWORD_RESET_PREFIX + email;
        redisTemplate.delete(key);
        log.info("Password reset token deleted for email: {}", email);
    }
}