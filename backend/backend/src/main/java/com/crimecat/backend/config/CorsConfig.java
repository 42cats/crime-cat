package com.crimecat.backend.config;


import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class CorsConfig implements WebMvcConfigurer {
    private final ServiceUrlConfig serviceUrlConfig;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 모든경로에 CORS 적용
                .allowedOrigins( "https://" + serviceUrlConfig.getDomain(),"https://www." + serviceUrlConfig.getDomain(), "http://localhost:5173", "https://localhost:5173") // 접근허용 주소
                .allowCredentials(true)  //쿠키 및 인증 헤더 적용
                .exposedHeaders("X-CSRF-TOKEN") // 클라이언트가 응답 헤더에서 CSRF 토큰 읽을 수 있게 허용
                .allowedMethods("POST", "GET", "DELETE", "PATCH", "PUT", "OPTIONS")
                .maxAge(3600); // preflight 캐시 시간 (초)
    }
}
