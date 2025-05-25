package com.crimecat.backend.notification.template;

import com.github.jknack.handlebars.Context;
import com.github.jknack.handlebars.Handlebars;
import com.github.jknack.handlebars.Template;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

/**
 * Handlebars 기반 템플릿 메시지 렌더러
 * 조건부 처리, 반복문, 헬퍼 함수 등을 지원
 */
@Component
public class HandlebarsMessageRenderer {
    
    private final Handlebars handlebars;
    
    public HandlebarsMessageRenderer() {
        this.handlebars = new Handlebars();
        setupHelpers();
    }
    
    /**
     * 템플릿 문자열을 렌더링하여 최종 메시지 생성
     * @param template 템플릿 문자열 (Handlebars 문법)
     * @param context 치환할 변수들
     * @return 렌더링된 문자열
     */
    public String render(String template, Map<String, Object> context) {
        if (template == null || template.isEmpty()) {
            return template;
        }
        
        try {
            // 인라인 템플릿 컴파일
            Template compiledTemplate = handlebars.compileInline(template);
            
            // Context 생성 및 렌더링
            Context handlebarsContext = Context.newContext(context);
            return compiledTemplate.apply(handlebarsContext);
            
        } catch (IOException e) {
            // 템플릿 컴파일 또는 렌더링 실패 시 원본 템플릿 반환
            // 로깅은 추후 추가 가능
            throw new RuntimeException("Failed to render template: " + template, e);
        }
    }
    
    /**
     * 커스텀 헬퍼 함수 등록
     * 필요에 따라 확장 가능
     */
    private void setupHelpers() {
        // 예시: 문자열 대문자 변환 헬퍼
        handlebars.registerHelper("upperCase", (context, options) -> {
            if (context instanceof String) {
                return ((String) context).toUpperCase();
            }
            return context;
        });
        
        // 예시: 날짜 포맷 헬퍼 (필요시 사용)
        handlebars.registerHelper("formatDate", (context, options) -> {
            // 날짜 포맷 로직 추가 가능
            return context != null ? context.toString() : "";
        });
    }
}
