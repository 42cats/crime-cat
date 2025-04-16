package com.crimecat.backend.config;


import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 모든경로에 CORS 적용
                .allowedOrigins("https://crimecat.org", "http://localhost:8081", "https://dev.crimecat.org") // 접근허용 주소
                .allowCredentials(true)  //쿠키 및 인증 헤더 적용
                .allowedMethods("*"); //post, get, put ,delete 다 적용
    }
}
