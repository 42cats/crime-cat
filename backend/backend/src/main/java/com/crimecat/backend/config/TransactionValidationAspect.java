package com.crimecat.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;

/**
 * 트랜잭션 유효성 검증 Aspect
 * - 읽기 전용 메서드에 @Transactional(readOnly = true) 누락 체크
 * - 개발 환경에서만 활성화
 */
@Slf4j
@Aspect
@Component
@ConditionalOnProperty(name = "transaction.validation.enabled", havingValue = "true")
public class TransactionValidationAspect {

    /**
     * Repository 메서드 중 읽기 작업인데 readOnly가 설정되지 않은 경우 경고
     */
    @Before("@within(org.springframework.stereotype.Repository) && " +
            "execution(* find*(..)) || execution(* get*(..)) || execution(* count*(..)) || execution(* exists*(..))")
    public void validateReadOnlyTransaction(JoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        
        Transactional transactional = method.getAnnotation(Transactional.class);
        if (transactional == null) {
            // 클래스 레벨 확인
            transactional = joinPoint.getTarget().getClass().getAnnotation(Transactional.class);
        }
        
        if (transactional != null && !transactional.readOnly()) {
            log.warn("읽기 메서드에 @Transactional(readOnly = true)가 누락되었습니다: {}", 
                method.getDeclaringClass().getSimpleName() + "." + method.getName());
        }
    }

    /**
     * Service 메서드 중 조회 작업인데 readOnly가 설정되지 않은 경우 경고
     */
    @Before("@within(org.springframework.stereotype.Service) && " +
            "execution(* find*(..)) || execution(* get*(..)) || execution(* search*(..)) || " +
            "execution(* load*(..)) || execution(* count*(..)) || execution(* exists*(..))")
    public void validateServiceReadOnlyTransaction(JoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        String methodName = method.getDeclaringClass().getSimpleName() + "." + method.getName();
        
        // 메서드 레벨 트랜잭션 확인
        Transactional methodTx = method.getAnnotation(Transactional.class);
        if (methodTx != null) {
            if (!methodTx.readOnly()) {
                log.warn("읽기 전용 메서드에 readOnly=true 설정이 권장됩니다: {}", methodName);
            }
            return;
        }
        
        // 클래스 레벨 트랜잭션 확인
        Transactional classTx = method.getDeclaringClass().getAnnotation(Transactional.class);
        if (classTx != null && !classTx.readOnly()) {
            log.warn("읽기 전용 메서드가 쓰기 가능 클래스 트랜잭션을 상속받고 있습니다: {}", methodName);
        }
    }
}