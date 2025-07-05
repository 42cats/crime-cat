package com.crimecat.backend.config;

import com.crimecat.backend.utils.ipInterceptor.ClientIpInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {
  private final ClientIpInterceptor ipInterceptor;
  private final ServiceUrlConfig serviceUrlConfig;
  
  @Value("${app.cors.allowed-origins:${SPRING_CORS_ALLOWED_ORIGINS:}}")
  private String allowedOrigins;
  
  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(ipInterceptor)
        .addPathPatterns("/api/**");
  }
  
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    // 기본 허용 Origin 목록
    String[] defaultOrigins = {
        "https://" + serviceUrlConfig.getDomain(),
        "https://www." + serviceUrlConfig.getDomain(), 
        "http://localhost:3000", 
        "http://localhost:5173", 
        "https://localhost:5173"
    };
    
    // 환경변수에서 추가 Origin 가져오기
    String[] finalOrigins = defaultOrigins;
    if (allowedOrigins != null && !allowedOrigins.trim().isEmpty()) {
      String[] additionalOrigins = allowedOrigins.split(",");
      String[] combinedOrigins = new String[defaultOrigins.length + additionalOrigins.length];
      System.arraycopy(defaultOrigins, 0, combinedOrigins, 0, defaultOrigins.length);
      System.arraycopy(additionalOrigins, 0, combinedOrigins, defaultOrigins.length, additionalOrigins.length);
      finalOrigins = combinedOrigins;
    }
    
    registry.addMapping("/**") // 모든경로에 CORS 적용
            .allowedOrigins(finalOrigins) // 동적 접근허용 주소
            .allowCredentials(true)  //쿠키 및 인증 헤더 적용
            .allowedHeaders("*") // 모든 헤더 허용
            .exposedHeaders("X-CSRF-TOKEN") // 클라이언트가 응답 헤더에서 CSRF 토큰 읽을 수 있게 허용
            .allowedMethods("POST", "GET", "DELETE", "PATCH", "PUT", "OPTIONS")
            .maxAge(3600); // preflight 캐시 시간 (초)
  }
}