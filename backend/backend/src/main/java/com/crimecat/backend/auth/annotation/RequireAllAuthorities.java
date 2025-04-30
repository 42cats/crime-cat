package com.crimecat.backend.auth.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 메소드 실행 시 모든 필수 권한이 필요함을 나타내는 어노테이션
 * 하나라도 없는 사용자는 FORBIDDEN 예외가 발생합니다.
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireAllAuthorities {
    /**
     * 필요한 권한 목록 (모두 가지고 있어야 함)
     */
    String[] value();
}
