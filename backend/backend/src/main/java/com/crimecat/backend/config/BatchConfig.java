package com.crimecat.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * 배치 처리 최적화 설정
 */
@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
    basePackages = "com.crimecat.backend",
    enableDefaultTransactions = false  // 명시적 트랜잭션 관리
)
@ConfigurationProperties(prefix = "batch")
public class BatchConfig {
    
    private int defaultBatchSize = 1000;
    private int jdbcBatchSize = 50;
    private boolean orderInserts = true;
    private boolean orderUpdates = true;
    private boolean batchVersionedData = true;

    // Getters and Setters
    public int getDefaultBatchSize() {
        return defaultBatchSize;
    }

    public void setDefaultBatchSize(int defaultBatchSize) {
        this.defaultBatchSize = defaultBatchSize;
    }

    public int getJdbcBatchSize() {
        return jdbcBatchSize;
    }

    public void setJdbcBatchSize(int jdbcBatchSize) {
        this.jdbcBatchSize = jdbcBatchSize;
    }

    public boolean isOrderInserts() {
        return orderInserts;
    }

    public void setOrderInserts(boolean orderInserts) {
        this.orderInserts = orderInserts;
    }

    public boolean isOrderUpdates() {
        return orderUpdates;
    }

    public void setOrderUpdates(boolean orderUpdates) {
        this.orderUpdates = orderUpdates;
    }

    public boolean isBatchVersionedData() {
        return batchVersionedData;
    }

    public void setBatchVersionedData(boolean batchVersionedData) {
        this.batchVersionedData = batchVersionedData;
    }
}