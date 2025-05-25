package com.crimecat.backend.config;

import com.crimecat.backend.utils.ipInterceptor.ClientIpInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {
  private final ClientIpInterceptor ipInterceptor;
  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(ipInterceptor)
        .addPathPatterns("/api/**");
  }
}