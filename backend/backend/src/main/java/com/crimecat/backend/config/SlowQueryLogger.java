package com.crimecat.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.hibernate.EmptyInterceptor;
import org.hibernate.type.Type;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.Iterator;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Hibernate Interceptor를 사용한 Slow Query 로깅
 */
@Slf4j
@Component
public class SlowQueryLogger extends EmptyInterceptor {

    private static final long SLOW_QUERY_THRESHOLD = 1000; // 1초
    private final ThreadLocal<Long> queryStartTime = new ThreadLocal<>();
    private final ConcurrentHashMap<String, AtomicLong> slowQueryStats = new ConcurrentHashMap<>();

    @Override
    public boolean onLoad(Object entity, Serializable id, Object[] state, String[] propertyNames, Type[] types) {
        startTimer();
        return super.onLoad(entity, id, state, propertyNames, types);
    }

    @Override
    public boolean onSave(Object entity, Serializable id, Object[] state, String[] propertyNames, Type[] types) {
        startTimer();
        return super.onSave(entity, id, state, propertyNames, types);
    }

    @Override
    public void onDelete(Object entity, Serializable id, Object[] state, String[] propertyNames, Type[] types) {
        startTimer();
        super.onDelete(entity, id, state, propertyNames, types);
    }

    @Override
    public void postFlush(Iterator entities) {
        Long startTime = queryStartTime.get();
        if (startTime != null) {
            long executionTime = System.currentTimeMillis() - startTime;
            if (executionTime > SLOW_QUERY_THRESHOLD) {
                String entityInfo = getEntityInfo(entities);
                log.warn("Slow Query 감지 - 실행 시간: {}ms, 엔티티: {}", executionTime, entityInfo);
                
                // 통계 업데이트
                slowQueryStats.computeIfAbsent(entityInfo, k -> new AtomicLong(0)).incrementAndGet();
            }
            queryStartTime.remove();
        }
    }

    private void startTimer() {
        queryStartTime.set(System.currentTimeMillis());
    }

    private String getEntityInfo(Iterator entities) {
        if (entities != null && entities.hasNext()) {
            Object entity = entities.next();
            return entity.getClass().getSimpleName();
        }
        return "Unknown";
    }

    /**
     * Slow Query 통계 출력
     */
    public void printSlowQueryStats() {
        if (!slowQueryStats.isEmpty()) {
            log.info("=== Slow Query 통계 ===");
            slowQueryStats.forEach((entity, count) -> 
                log.info("엔티티: {}, Slow Query 횟수: {}", entity, count.get())
            );
        }
    }
}