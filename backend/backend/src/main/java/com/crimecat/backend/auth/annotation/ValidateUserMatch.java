package com.crimecat.backend.auth.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 메소드 실행 시 현재 인증된 사용자와 파라미터로 전달된 사용자 ID가 일치하는지 검증하는 어노테이션
 * 일치하지 않으면 FORBIDDEN 예외가 발생합니다.
 */
@Target({ElementType.METHOD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidateUserMatch {
    /**
     * 사용자 ID 파라미터 이름
     * 메소드 파라미터에 적용할 경우 생략 가능
     */
    String value() default "";
}
