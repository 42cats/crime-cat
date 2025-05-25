package com.crimecat.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for optimization features
 */
@Configuration
@ConfigurationProperties(prefix = "optimization")
public class OptimizationProperties {
    
    private boolean enabled = false;
    private CacheProperties cache = new CacheProperties();
    private MetricsProperties metrics = new MetricsProperties();
    
    public static class CacheProperties {
        private String type = "simple"; // simple, hybrid
        private boolean warmupEnabled = false;
        
        public String getType() {
            return type;
        }
        
        public void setType(String type) {
            this.type = type;
        }
        
        public boolean isWarmupEnabled() {
            return warmupEnabled;
        }
        
        public void setWarmupEnabled(boolean warmupEnabled) {
            this.warmupEnabled = warmupEnabled;
        }
    }
    
    public static class MetricsProperties {
        private boolean cacheEnabled = false;
        
        public boolean isCacheEnabled() {
            return cacheEnabled;
        }
        
        public void setCacheEnabled(boolean cacheEnabled) {
            this.cacheEnabled = cacheEnabled;
        }
    }
    
    public boolean isEnabled() {
        return enabled;
    }
    
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
    
    public CacheProperties getCache() {
        return cache;
    }
    
    public void setCache(CacheProperties cache) {
        this.cache = cache;
    }
    
    public MetricsProperties getMetrics() {
        return metrics;
    }
    
    public void setMetrics(MetricsProperties metrics) {
        this.metrics = metrics;
    }
}