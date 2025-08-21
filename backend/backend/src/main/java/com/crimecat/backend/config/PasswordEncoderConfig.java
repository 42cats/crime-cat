package com.crimecat.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * 비밀번호 암호화 설정
 * 비밀 일정 기능에서 사용되는 BCrypt 인코더 설정
 */
@Configuration
public class PasswordEncoderConfig {

    /**
     * BCrypt 패스워드 인코더
     * 비밀 일정의 패스워드 해시화에 사용
     */
    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }
}