package com.crimecat.backend.config.cache;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 캐시 버전 관리를 위한 설정 클래스
 * application.yml에서 cache.version 값을 변경하면 모든 캐시가 무효화됨
 */
@Configuration
@ConfigurationProperties(prefix = "cache")
public class CacheVersionConfig {
    
    private String version = "v1";
    
    public String getVersion() {
        return version;
    }
    
    public void setVersion(String version) {
        this.version = version;
    }
    
    /**
     * 버전이 포함된 캐시 키 생성
     */
    public String getVersionedKey(String cacheKey) {
        return version + ":" + cacheKey;
    }
}
