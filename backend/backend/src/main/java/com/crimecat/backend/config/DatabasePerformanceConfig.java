package com.crimecat.backend.config;

import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.LazyConnectionDataSourceProxy;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.util.concurrent.TimeUnit;

/**
 * 데이터베이스 성능 모니터링 및 최적화 설정
 * - Slow Query 감지
 * - 읽기 전용 트랜잭션 최적화
 * - 커넥션 풀 모니터링
 */
@Slf4j
@Aspect
@Configuration
@EnableScheduling
public class DatabasePerformanceConfig {

    private static final long SLOW_QUERY_THRESHOLD_MS = 1000; // 1초

    /**
     * LazyConnectionDataSourceProxy를 사용하여 불필요한 커넥션 획득 방지
     */
    @Bean
    @ConditionalOnProperty(name = "spring.datasource.lazy", havingValue = "true", matchIfMissing = true)
    public DataSource lazyDataSource(DataSource dataSource) {
        return new LazyConnectionDataSourceProxy(dataSource);
    }

    /**
     * 읽기 전용 트랜잭션 모니터링
     */
    @Around("@annotation(transactional)")
    public Object monitorReadOnlyTransaction(ProceedingJoinPoint joinPoint, Transactional transactional) throws Throwable {
        String methodName = joinPoint.getSignature().toShortString();
        
        if (transactional.readOnly()) {
            log.trace("읽기 전용 트랜잭션 실행: {}", methodName);
        }
        
        long startTime = System.currentTimeMillis();
        try {
            return joinPoint.proceed();
        } finally {
            long executionTime = System.currentTimeMillis() - startTime;
            
            if (executionTime > SLOW_QUERY_THRESHOLD_MS) {
                log.warn("Slow Query 감지 - 메소드: {}, 실행 시간: {}ms, 읽기 전용: {}", 
                    methodName, executionTime, transactional.readOnly());
            }
        }
    }

    /**
     * 커넥션 풀 상태 모니터링 (5분마다)
     */
    @Scheduled(fixedDelay = 5, timeUnit = TimeUnit.MINUTES)
    public void monitorConnectionPool() {
        // HikariCP를 사용한다고 가정
        try {
            var dataSource = getHikariDataSource();
            if (dataSource != null) {
                var pool = dataSource.getHikariPoolMXBean();
                
                log.info("=== 커넥션 풀 상태 ===");
                log.info("활성 커넥션: {}", pool.getActiveConnections());
                log.info("유휴 커넥션: {}", pool.getIdleConnections());
                log.info("전체 커넥션: {}", pool.getTotalConnections());
                log.info("대기 중인 쓰레드: {}", pool.getThreadsAwaitingConnection());
                
                // 경고 상황 체크
                if (pool.getActiveConnections() > pool.getTotalConnections() * 0.8) {
                    log.warn("커넥션 풀 사용률이 80%를 초과했습니다!");
                }
            }
        } catch (Exception e) {
            log.debug("커넥션 풀 모니터링 중 오류", e);
        }
    }

    private HikariDataSource getHikariDataSource() {
        // 실제 구현에서는 ApplicationContext에서 DataSource를 가져와서 처리
        // 여기서는 예시로 null 반환
        return null;
    }
}