package com.crimecat.backend.auth.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 메소드 실행 시 현재 사용자가 관리자이거나 동일한 사용자인지 확인하는 어노테이션
 * (관리자는 다른 사용자의 데이터에 접근 가능하도록)
 * 조건을 만족하지 않으면 FORBIDDEN 예외가 발생합니다.
 */
@Target({ElementType.METHOD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidateAdminOrSameUser {
    /**
     * 사용자 ID 파라미터 이름
     * 메소드 파라미터에 적용할 경우 생략 가능
     */
    String value() default "";
}
