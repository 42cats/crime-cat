package com.crimecat.backend.auth.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 메소드 실행 시 현재 인증된 사용자가 해당 스노우플레이크의 소유자인지 확인하는 어노테이션
 * 소유자가 아니면 INVALID_ACCESS 예외가 발생합니다.
 */
@Target({ElementType.METHOD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidateDiscordSnowflake {
    /**
     * 스노우플레이크 파라미터 이름
     * 메소드 파라미터에 적용할 경우 생략 가능
     */
    String value() default "";
}
