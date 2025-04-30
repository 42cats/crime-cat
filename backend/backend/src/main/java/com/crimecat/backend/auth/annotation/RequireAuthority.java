package com.crimecat.backend.auth.annotation;

import com.crimecat.backend.web.webUser.UserRole;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 메소드 실행 시 특정 권한이 필요함을 나타내는 어노테이션
 * 해당 권한이 없는 사용자는 FORBIDDEN 예외가 발생합니다.
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireAuthority {
    /**
     * 필요한 권한
     */
    UserRole value();
}
