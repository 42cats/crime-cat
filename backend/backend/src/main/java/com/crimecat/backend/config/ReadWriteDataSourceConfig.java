package com.crimecat.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.LazyConnectionDataSourceProxy;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * 읽기/쓰기 데이터소스 분리 설정
 * - Master DB: 쓰기 작업
 * - Slave DB: 읽기 작업
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "datasource.replication.enabled", havingValue = "true")
public class ReadWriteDataSourceConfig {

    @Bean
    @ConfigurationProperties(prefix = "datasource.master")
    public HikariConfig masterHikariConfig() {
        return new HikariConfig();
    }

    @Bean
    @ConfigurationProperties(prefix = "datasource.slave")
    public HikariConfig slaveHikariConfig() {
        return new HikariConfig();
    }

    @Bean
    public DataSource masterDataSource(@Qualifier("masterHikariConfig") HikariConfig config) {
        return new HikariDataSource(config);
    }

    @Bean
    public DataSource slaveDataSource(@Qualifier("slaveHikariConfig") HikariConfig config) {
        return new HikariDataSource(config);
    }

    @Bean
    public DataSource routingDataSource(
            @Qualifier("masterDataSource") DataSource masterDataSource,
            @Qualifier("slaveDataSource") DataSource slaveDataSource) {
        
        RoutingDataSource routingDataSource = new RoutingDataSource();
        
        Map<Object, Object> dataSourceMap = new HashMap<>();
        dataSourceMap.put(DataSourceType.MASTER, masterDataSource);
        dataSourceMap.put(DataSourceType.SLAVE, slaveDataSource);
        
        routingDataSource.setTargetDataSources(dataSourceMap);
        routingDataSource.setDefaultTargetDataSource(masterDataSource);
        
        return routingDataSource;
    }

    @Bean
    @Primary
    public DataSource dataSource(@Qualifier("routingDataSource") DataSource routingDataSource) {
        // LazyConnectionDataSourceProxy로 감싸서 실제 사용 시점에 커넥션 획득
        return new LazyConnectionDataSourceProxy(routingDataSource);
    }

    /**
     * 트랜잭션 상태에 따라 데이터소스를 라우팅
     */
    public static class RoutingDataSource extends AbstractRoutingDataSource {
        
        @Override
        protected Object determineCurrentLookupKey() {
            boolean isReadOnly = TransactionSynchronizationManager.isCurrentTransactionReadOnly();
            
            if (isReadOnly) {
                log.trace("Slave 데이터소스 사용 (읽기 전용)");
                return DataSourceType.SLAVE;
            } else {
                log.trace("Master 데이터소스 사용 (읽기/쓰기)");
                return DataSourceType.MASTER;
            }
        }
    }

    /**
     * 데이터소스 타입
     */
    public enum DataSourceType {
        MASTER, SLAVE
    }
}