package com.crimecat.backend.trace.aspect;

import com.crimecat.backend.trace.LogTrace;
import com.crimecat.backend.trace.TraceStatus;
import com.crimecat.backend.trace.annotation.NoTrace;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
@Order(1)
@RequiredArgsConstructor
public class LogTraceAspect {
    
    private final LogTrace logTrace;
    
    // Controller 포인트컷
    @Pointcut("@within(org.springframework.web.bind.annotation.RestController) || " +
              "@within(org.springframework.stereotype.Controller)")
    public void controllerPointcut() {}
    
    // Service 포인트컷
    @Pointcut("@within(org.springframework.stereotype.Service)")
    public void servicePointcut() {}
    
    // Repository 포인트컷
    @Pointcut("@within(org.springframework.stereotype.Repository)")
    public void repositoryPointcut() {}
    
    // Component 포인트컷 (기타 컴포넌트들)
    @Pointcut("@within(org.springframework.stereotype.Component)")
    public void componentPointcut() {}
    
    // @NoTrace가 붙은 클래스나 메서드 제외
    @Pointcut("!@within(com.crimecat.backend.trace.annotation.NoTrace) && " +
              "!@annotation(com.crimecat.backend.trace.annotation.NoTrace)")
    public void notNoTrace() {}
    
    // trace 패키지 자체는 제외 (무한 루프 방지)
    @Pointcut("!within(com.crimecat.backend.trace..*)")
    public void notTracePackage() {}
    
    // 모든 조건을 결합한 최종 포인트컷
    @Around("(controllerPointcut() || servicePointcut() || repositoryPointcut() || componentPointcut()) " +
            "&& notNoTrace() && notTracePackage()")
    public Object execute(ProceedingJoinPoint joinPoint) throws Throwable {
        TraceStatus status = null;
        
        try {
            String message = getMethodSignature(joinPoint);
            status = logTrace.begin(message);
            
            // 실제 메서드 실행
            Object result = joinPoint.proceed();
            
            logTrace.end(status);
            return result;
            
        } catch (Exception e) {
            if (status != null) {
                logTrace.exception(status, e);
            }
            throw e;
        }
    }
    
    private String getMethodSignature(ProceedingJoinPoint joinPoint) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        
        // Controller인 경우 HTTP 메서드 정보도 포함
        if (joinPoint.getTarget().getClass().isAnnotationPresent(org.springframework.web.bind.annotation.RestController.class) ||
            joinPoint.getTarget().getClass().isAnnotationPresent(org.springframework.stereotype.Controller.class)) {
            return String.format("%s.%s()", className, methodName);
        }
        
        return String.format("%s.%s()", className, methodName);
    }
}