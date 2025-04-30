package com.crimecat.backend.auth.annotation;

import com.crimecat.backend.web.webUser.UserRole;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 메소드 실행 시 웹에서  전달받은 사용자 ID의 소유자에 대한 작업을 수행할 권한이 있는지 확인하는 어노테이션
 * 자신의 데이터이거나 필요한 역할 이상을 가진 사용자만 접근 가능하며,
 * 조건을 만족하지 않으면 FORBIDDEN 예외가 발생합니다.
 */
@Target({ElementType.METHOD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidateSelfOrHasRole {
    /**
     * 이 역할 이상만 다른 사용자 데이터에 접근 가능
     */
    UserRole value();
    
    /**
     * 사용자 ID 파라미터 이름
     * 메소드 파라미터에 적용할 경우 생략 가능
     */
    String paramName() default "";
}
