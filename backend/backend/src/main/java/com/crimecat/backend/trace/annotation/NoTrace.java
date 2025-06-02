package com.crimecat.backend.trace.annotation;

import java.lang.annotation.*;

/**
 * 이 어노테이션이 붙은 클래스나 메서드는 로그 추적에서 제외됩니다.
 * 성능이 중요하거나 로그가 불필요한 경우 사용합니다.
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface NoTrace {
}