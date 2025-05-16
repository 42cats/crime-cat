package com.crimecat.backend.notification.listener;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * 비동기 이벤트 처리를 위한 설정
 */
@Configuration
@EnableAsync
public class NotificationAsyncConfig {
    
    /**
     * 알림 이벤트 처리를 위한 전용 스레드 풀
     */
    @Bean(name = "notificationTaskExecutor")
    public Executor notificationTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // 기본 스레드 수
        executor.setCorePoolSize(5);
        
        // 최대 스레드 수
        executor.setMaxPoolSize(20);
        
        // 큐 용량
        executor.setQueueCapacity(100);
        
        // 스레드 이름 접두사
        executor.setThreadNamePrefix("NotificationEvent-");
        
        // 스레드 초기화
        executor.initialize();
        
        return executor;
    }
}
