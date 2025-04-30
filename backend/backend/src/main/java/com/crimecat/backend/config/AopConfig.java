package com.crimecat.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

/**
 * AOP 설정을 활성화하는 설정 클래스
 */
@Configuration
@EnableAspectJAutoProxy
public class AopConfig {
    // 추가적인 설정이 필요한 경우 여기에 빈(Bean)을 등록할 수 있습니다.
}
