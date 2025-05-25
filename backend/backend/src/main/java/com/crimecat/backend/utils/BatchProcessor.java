package com.crimecat.backend.utils;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.function.Consumer;

/**
 * 배치 처리 유틸리티
 * - 대량 데이터 처리 시 메모리 효율적인 배치 처리
 * - 벌크 연산 지원
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BatchProcessor {

    private final EntityManager entityManager;
    private static final int DEFAULT_BATCH_SIZE = 1000;

    /**
     * 대량 저장 (배치 처리)
     */
    @Transactional
    public <T> void saveInBatches(Collection<T> entities, JpaRepository<T, ?> repository) {
        saveInBatches(entities, repository, DEFAULT_BATCH_SIZE);
    }

    /**
     * 대량 저장 (배치 크기 지정)
     */
    @Transactional
    public <T> void saveInBatches(Collection<T> entities, JpaRepository<T, ?> repository, int batchSize) {
        if (entities == null || entities.isEmpty()) {
            return;
        }

        List<T> batch = new ArrayList<>(batchSize);
        int count = 0;

        for (T entity : entities) {
            batch.add(entity);
            
            if (batch.size() == batchSize) {
                repository.saveAll(batch);
                entityManager.flush();
                entityManager.clear();
                
                count += batch.size();
                log.debug("배치 저장 진행: {} 건 완료", count);
                batch.clear();
            }
        }

        // 남은 데이터 처리
        if (!batch.isEmpty()) {
            repository.saveAll(batch);
            entityManager.flush();
            entityManager.clear();
            count += batch.size();
        }

        log.info("배치 저장 완료: 총 {} 건", count);
    }

    /**
     * 대량 삭제 (배치 처리)
     */
    @Transactional
    public <T> void deleteInBatches(Collection<T> entities, JpaRepository<T, ?> repository) {
        deleteInBatches(entities, repository, DEFAULT_BATCH_SIZE);
    }

    /**
     * 대량 삭제 (배치 크기 지정)
     */
    @Transactional
    public <T> void deleteInBatches(Collection<T> entities, JpaRepository<T, ?> repository, int batchSize) {
        if (entities == null || entities.isEmpty()) {
            return;
        }

        List<T> batch = new ArrayList<>(batchSize);
        int count = 0;

        for (T entity : entities) {
            batch.add(entity);
            
            if (batch.size() == batchSize) {
                repository.deleteAll(batch);
                entityManager.flush();
                entityManager.clear();
                
                count += batch.size();
                log.debug("배치 삭제 진행: {} 건 완료", count);
                batch.clear();
            }
        }

        // 남은 데이터 처리
        if (!batch.isEmpty()) {
            repository.deleteAll(batch);
            entityManager.flush();
            entityManager.clear();
            count += batch.size();
        }

        log.info("배치 삭제 완료: 총 {} 건", count);
    }

    /**
     * 대량 데이터 처리 (메모리 효율적)
     */
    @Transactional(readOnly = true)
    public <T> void processInBatches(List<T> items, Consumer<List<T>> processor) {
        processInBatches(items, processor, DEFAULT_BATCH_SIZE);
    }

    /**
     * 대량 데이터 처리 (배치 크기 지정)
     */
    @Transactional(readOnly = true)
    public <T> void processInBatches(List<T> items, Consumer<List<T>> processor, int batchSize) {
        if (items == null || items.isEmpty()) {
            return;
        }

        int totalSize = items.size();
        int processedCount = 0;

        for (int i = 0; i < totalSize; i += batchSize) {
            int end = Math.min(i + batchSize, totalSize);
            List<T> batch = items.subList(i, end);
            
            processor.accept(batch);
            processedCount += batch.size();
            
            log.debug("배치 처리 진행: {}/{} 건", processedCount, totalSize);
            
            // 메모리 정리
            entityManager.clear();
        }

        log.info("배치 처리 완료: 총 {} 건", processedCount);
    }

    /**
     * 대량 업데이트 (JPQL 사용)
     */
    @Transactional
    public int bulkUpdate(String jpql, Object... parameters) {
        var query = entityManager.createQuery(jpql);
        
        for (int i = 0; i < parameters.length; i++) {
            query.setParameter(i + 1, parameters[i]);
        }
        
        int updatedCount = query.executeUpdate();
        entityManager.flush();
        entityManager.clear();
        
        log.info("벌크 업데이트 완료: {} 건", updatedCount);
        return updatedCount;
    }

    /**
     * 대량 삭제 (JPQL 사용)
     */
    @Transactional
    public int bulkDelete(String jpql, Object... parameters) {
        var query = entityManager.createQuery(jpql);
        
        for (int i = 0; i < parameters.length; i++) {
            query.setParameter(i + 1, parameters[i]);
        }
        
        int deletedCount = query.executeUpdate();
        entityManager.flush();
        entityManager.clear();
        
        log.info("벌크 삭제 완료: {} 건", deletedCount);
        return deletedCount;
    }
}