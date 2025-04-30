package com.crimecat.backend.auth.annotation;

import com.crimecat.backend.web.webUser.UserRole;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 메소드 실행 시 최소한 지정된 역할 이상을 가져야 함을 나타내는 어노테이션
 * (예: ADMIN은 MANAGER와 USER 권한도 가진 것으로 간주)
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireMinimumRole {
    /**
     * 최소 필요 역할
     */
    UserRole value();
}
