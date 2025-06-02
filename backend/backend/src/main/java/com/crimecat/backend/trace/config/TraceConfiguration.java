package com.crimecat.backend.trace.config;

import com.crimecat.backend.trace.LogTrace;
import com.crimecat.backend.trace.ThreadLocalLogTrace;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@Slf4j
@Configuration
@EnableAspectJAutoProxy
@ConditionalOnProperty(
    name = "trace.enabled",
    havingValue = "true",
    matchIfMissing = true  // 기본값은 활성화
)
public class TraceConfiguration {
    
    @Bean
    public LogTrace logTrace() {
        log.info("🔍 ThreadLocal 기반 로그 추적 시스템 활성화");
        return new ThreadLocalLogTrace();
    }
}