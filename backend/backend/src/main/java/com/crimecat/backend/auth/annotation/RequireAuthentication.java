package com.crimecat.backend.auth.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 메소드 실행 시 사용자 인증이 필요함을 나타내는 어노테이션
 * 인증되지 않은 사용자는 UNAUTHORIZED 예외가 발생합니다.
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireAuthentication {
}
