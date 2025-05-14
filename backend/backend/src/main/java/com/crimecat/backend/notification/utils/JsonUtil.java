package com.crimecat.backend.notification.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * JSON 처리 유틸리티
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JsonUtil {
    private static ObjectMapper objectMapper;
    
    private final ObjectMapper mapper;
    
    /**
     * Spring Bean 주입 후 static 필드 초기화
     */
    public void init() {
        JsonUtil.objectMapper = this.mapper;
    }
    
    @jakarta.annotation.PostConstruct
    private void initStaticMapper() {
        init();
    }
    
    /**
     * 객체를 JSON 문자열로 변환
     */
    public static String toJson(Object obj) {
        if (obj == null) {
            return null;
        }
        
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Error converting object to JSON", e);
            return null;
        }
    }
    
    /**
     * JSON 문자열에서 특정 필드를 String으로 추출
     * @param json JSON 문자열
     * @param fieldName 추출할 필드명
     * @return 추출된 문자열 값 (없으면 null)
     */
    public static String extractField(String json, String fieldName) {
        return getField(json, fieldName, String.class);
    }
    
    /**
     * JSON 문자열에서 특정 필드 추출
     */
    public static <T> T getField(String json, String fieldName, Class<T> targetClass) {
        if (json == null || fieldName == null) {
            return null;
        }
        
        try {
            JsonNode node = objectMapper.readTree(json);
            JsonNode fieldNode = node.get(fieldName);
            
            if (fieldNode == null) {
                return null;
            }
            
            return objectMapper.treeToValue(fieldNode, targetClass);
        } catch (Exception e) {
            log.error("Error extracting field '{}' from JSON", fieldName, e);
            return null;
        }
    }
    
    /**
     * JSON 문자열을 객체로 변환
     */
    public static <T> T fromJson(String json, Class<T> targetClass) {
        if (json == null) {
            return null;
        }
        
        try {
            return objectMapper.readValue(json, targetClass);
        } catch (Exception e) {
            log.error("Error converting JSON to object", e);
            return null;
        }
    }
}
