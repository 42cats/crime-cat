package com.crimecat.backend.notification.template;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 템플릿 메시지를 렌더링하는 엔진
 * ${변수명} 형태의 플레이스홀더를 실제 값으로 치환
 */
@Component
public class MessageRenderer {
    
    // ${변수명} 패턴을 매칭하는 정규식
    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\$\\{([^}]+)\\}");
    
    // 조건부 텍스트를 위한 패턴: {{? condition : true_text : false_text}}
    private static final Pattern CONDITIONAL_PATTERN = Pattern.compile("\\{\\{\\?\\s*([^:]+)\\s*:\\s*([^:]+)\\s*:\\s*([^}]+)\\}\\}");
    
    /**
     * 템플릿 문자열을 렌더링하여 최종 메시지 생성
     * @param template 템플릿 문자열
     * @param context 치환할 변수들
     * @return 렌더링된 문자열
     */
    public String render(String template, Map<String, Object> context) {
        if (template == null || template.isEmpty()) {
            return template;
        }
        
        String result = template;
        
        // 1. 조건부 텍스트 처리
        result = processConditionals(result, context);
        
        // 2. 변수 치환 처리
        result = processVariables(result, context);
        
        return result;
    }
    
    /**
     * 변수 플레이스홀더를 실제 값으로 치환
     */
    private String processVariables(String template, Map<String, Object> context) {
        Matcher matcher = PLACEHOLDER_PATTERN.matcher(template);
        StringBuffer result = new StringBuffer();
        
        while (matcher.find()) {
            String variableName = matcher.group(1);
            Object value = getNestedValue(context, variableName);
            
            // null 값 처리
            String replacement = value != null ? value.toString() : "";
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        
        matcher.appendTail(result);
        return result.toString();
    }
    
    /**
     * 조건부 텍스트 처리
     * {{? condition : true_text : false_text}} 형태 지원
     */
    private String processConditionals(String template, Map<String, Object> context) {
        Matcher matcher = CONDITIONAL_PATTERN.matcher(template);
        StringBuffer result = new StringBuffer();
        
        while (matcher.find()) {
            String condition = matcher.group(1).trim();
            String trueText = matcher.group(2).trim();
            String falseText = matcher.group(3).trim();
            
            boolean conditionResult = evaluateCondition(condition, context);
            String replacement = conditionResult ? trueText : falseText;
            
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        
        matcher.appendTail(result);
        return result.toString();
    }
    
    /**
     * 중첩된 객체에서 값 추출 (예: user.name)
     */
    private Object getNestedValue(Map<String, Object> context, String key) {
        String[] parts = key.split("\\.");
        Object current = context;
        
        for (String part : parts) {
            if (current instanceof Map) {
                current = ((Map<?, ?>) current).get(part);
            } else {
                // 리플렉션을 사용하여 객체의 필드 접근 (필요시 구현)
                return null;
            }
            
            if (current == null) {
                return null;
            }
        }
        
        return current;
    }
    
    /**
     * 간단한 조건 평가
     * 현재는 boolean 값과 null 체크만 지원
     */
    private boolean evaluateCondition(String condition, Map<String, Object> context) {
        if (condition.startsWith("!")) {
            // NOT 조건 처리
            String variableName = condition.substring(1).trim();
            Object value = getNestedValue(context, variableName);
            return value == null || (value instanceof Boolean && !((Boolean) value));
        } else {
            // 일반 조건 처리
            Object value = getNestedValue(context, condition);
            if (value instanceof Boolean) {
                return (Boolean) value;
            }
            // null이 아니면 true
            return value != null;
        }
    }
}
