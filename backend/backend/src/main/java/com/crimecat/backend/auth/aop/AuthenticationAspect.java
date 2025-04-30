package com.crimecat.backend.auth.aop;

import com.crimecat.backend.auth.annotation.*;
import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.auth.util.AuthenticationUtil;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.web.webUser.UserRole;
import com.crimecat.backend.web.webUser.domain.WebUser;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * 인증 관련 어노테이션을 처리하는 AOP 어드바이저
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class AuthenticationAspect {

    /**
     * @RequireAuthentication 어노테이션 처리
     */
    @Around("@annotation(com.crimecat.backend.auth.annotation.RequireAuthentication)")
    public Object requireAuthentication(ProceedingJoinPoint joinPoint) throws Throwable {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw ErrorStatus.UNAUTHORIZED.asException();
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof DiscordOAuth2User)) {
            throw ErrorStatus.INVALID_ACCESS.asException();
        }

        return joinPoint.proceed();
    }

    /**
     * @RequireAuthority 어노테이션 처리
     */
    @Around("@annotation(requireAuthority)")
    public Object requireAuthority(ProceedingJoinPoint joinPoint, RequireAuthority requireAuthority) throws Throwable {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw ErrorStatus.UNAUTHORIZED.asException();
        }

        UserRole role = requireAuthority.value();
        String roleWithPrefix = "ROLE_" + role.name();
        boolean hasAuthority = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(roleWithPrefix));

        if (!hasAuthority) {
            throw ErrorStatus.FORBIDDEN.asException();
        }

        return joinPoint.proceed();
    }

    /**
     * @RequireAllAuthorities 어노테이션 처리
     */
    @Around("@annotation(requireAllAuthorities)")
    public Object requireAllAuthorities(ProceedingJoinPoint joinPoint, RequireAllAuthorities requireAllAuthorities) throws Throwable {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw ErrorStatus.UNAUTHORIZED.asException();
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        List<String> userAuthorities = authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        for (String required : requireAllAuthorities.value()) {
            if (!userAuthorities.contains(required)) {
                throw ErrorStatus.FORBIDDEN.asException();
            }
        }

        return joinPoint.proceed();
    }

    /**
     * @RequireMinimumRole 어노테이션 처리
     */
    @Around("@annotation(requireMinimumRole)")
    public Object requireMinimumRole(ProceedingJoinPoint joinPoint, RequireMinimumRole requireMinimumRole) throws Throwable {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        UserRole userRole = currentUser.getRole();
        UserRole minimumRole = requireMinimumRole.value();

        // UserRole enum의 순서가 USER, MANAGER, ADMIN이라고 가정
        // ordinal 값이 클수록 권한이 높음
        if (userRole.ordinal() < minimumRole.ordinal()) {
            throw ErrorStatus.FORBIDDEN.asException();
        }

        return joinPoint.proceed();
    }

    /**
     * @ValidateUserMatch 어노테이션 처리 (메소드 레벨)
     */
    @Around("@annotation(validateUserMatch)")
    public Object validateUserMatch(ProceedingJoinPoint joinPoint, ValidateUserMatch validateUserMatch) throws Throwable {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        String paramName = validateUserMatch.value();
        
        // 파라미터 이름이 제공된 경우
        if (!paramName.isEmpty()) {
            Object userId = getParameterValueByName(joinPoint, paramName);
            
            if (userId instanceof UUID) {
                if (!currentUser.getId().equals(userId)) {
                    throw ErrorStatus.FORBIDDEN.asException();
                }
            } else {
                log.error("ValidateUserMatch annotation parameter is not a UUID: {}", paramName);
                throw ErrorStatus.SERVER_ERROR.asException();
            }
        }
        // 파라미터 이름이 제공되지 않은 경우 (전체 메소드 파라미터 확인)
        else {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();
            Object[] args = joinPoint.getArgs();
            Parameter[] parameters = method.getParameters();
            
            boolean parameterFound = false;
            
            for (int i = 0; i < parameters.length; i++) {
                Parameter parameter = parameters[i];
                if (parameter.isAnnotationPresent(ValidateUserMatch.class) && args[i] instanceof UUID) {
                    parameterFound = true;
                    if (!currentUser.getId().equals(args[i])) {
                        throw ErrorStatus.FORBIDDEN.asException();
                    }
                }
            }
            
            if (!parameterFound) {
                log.error("No parameter found with ValidateUserMatch annotation");
                throw ErrorStatus.SERVER_ERROR.asException();
            }
        }

        return joinPoint.proceed();
    }

    /**
     * @ValidateDiscordSnowflake 어노테이션 처리 (메소드 레벨)
     */
    @Around("@annotation(validateDiscordSnowflake)")
    public Object validateDiscordSnowflake(ProceedingJoinPoint joinPoint, ValidateDiscordSnowflake validateDiscordSnowflake) throws Throwable {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        String paramName = validateDiscordSnowflake.value();
        
        // 파라미터 이름이 제공된 경우
        if (!paramName.isEmpty()) {
            Object snowflake = getParameterValueByName(joinPoint, paramName);
            
            if (snowflake instanceof String) {
                if (!currentUser.getDiscordUserSnowflake().equals(snowflake)) {
                    throw ErrorStatus.INVALID_ACCESS.asException();
                }
            } else {
                log.error("ValidateDiscordSnowflake annotation parameter is not a String: {}", paramName);
                throw ErrorStatus.SERVER_ERROR.asException();
            }
        }
        // 파라미터 이름이 제공되지 않은 경우 (전체 메소드 파라미터 확인)
        else {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();
            Object[] args = joinPoint.getArgs();
            Parameter[] parameters = method.getParameters();
            
            boolean parameterFound = false;
            
            for (int i = 0; i < parameters.length; i++) {
                Parameter parameter = parameters[i];
                if (parameter.isAnnotationPresent(ValidateDiscordSnowflake.class) && args[i] instanceof String) {
                    parameterFound = true;
                    if (!currentUser.getDiscordUserSnowflake().equals(args[i])) {
                        throw ErrorStatus.INVALID_ACCESS.asException();
                    }
                }
            }
            
            if (!parameterFound) {
                log.error("No parameter found with ValidateDiscordSnowflake annotation");
                throw ErrorStatus.SERVER_ERROR.asException();
            }
        }

        return joinPoint.proceed();
    }

    /**
     * @ValidateAdminOrSameUser 어노테이션 처리 (메소드 레벨)
     */
    @Around("@annotation(validateAdminOrSameUser)")
    public Object validateAdminOrSameUser(ProceedingJoinPoint joinPoint, ValidateAdminOrSameUser validateAdminOrSameUser) throws Throwable {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        String paramName = validateAdminOrSameUser.value();
        
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + UserRole.ADMIN.name()));
                
        // 관리자인 경우 바로 통과
        if (isAdmin) {
            return joinPoint.proceed();
        }
        
        // 파라미터 이름이 제공된 경우
        if (!paramName.isEmpty()) {
            Object userId = getParameterValueByName(joinPoint, paramName);
            
            if (userId instanceof UUID) {
                if (!currentUser.getId().equals(userId)) {
                    throw ErrorStatus.FORBIDDEN.asException();
                }
            } else {
                log.error("ValidateAdminOrSameUser annotation parameter is not a UUID: {}", paramName);
                throw ErrorStatus.SERVER_ERROR.asException();
            }
        }
        // 파라미터 이름이 제공되지 않은 경우 (전체 메소드 파라미터 확인)
        else {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();
            Object[] args = joinPoint.getArgs();
            Parameter[] parameters = method.getParameters();
            
            boolean parameterFound = false;
            
            for (int i = 0; i < parameters.length; i++) {
                Parameter parameter = parameters[i];
                if (parameter.isAnnotationPresent(ValidateAdminOrSameUser.class) && args[i] instanceof UUID) {
                    parameterFound = true;
                    if (!currentUser.getId().equals(args[i])) {
                        throw ErrorStatus.FORBIDDEN.asException();
                    }
                }
            }
            
            if (!parameterFound) {
                log.error("No parameter found with ValidateAdminOrSameUser annotation");
                throw ErrorStatus.SERVER_ERROR.asException();
            }
        }

        return joinPoint.proceed();
    }

    /**
     * @ValidateSelfOrHasRole 어노테이션 처리 (메소드 레벨)
     */
    @Around("@annotation(validateSelfOrHasRole)")
    public Object validateSelfOrHasRole(ProceedingJoinPoint joinPoint, ValidateSelfOrHasRole validateSelfOrHasRole) throws Throwable {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        String paramName = validateSelfOrHasRole.paramName();
        UserRole minimumRole = validateSelfOrHasRole.value();
        
        // 파라미터 이름이 제공된 경우
        if (!paramName.isEmpty()) {
            Object userId = getParameterValueByName(joinPoint, paramName);
            
            if (userId instanceof UUID) {
                // 본인의 데이터면 접근 허용
                if (currentUser.getId().equals(userId)) {
                    return joinPoint.proceed();
                }
                
                // 본인이 아니라면 최소 역할 확인
                UserRole userRole = currentUser.getRole();
                if (userRole.ordinal() < minimumRole.ordinal()) {
                    throw ErrorStatus.FORBIDDEN.asException();
                }
            } else {
                log.error("ValidateSelfOrHasRole annotation parameter is not a UUID: {}", paramName);
                throw ErrorStatus.SERVER_ERROR.asException();
            }
        }
        // 파라미터 이름이 제공되지 않은 경우 (전체 메소드 파라미터 확인)
        else {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();
            Object[] args = joinPoint.getArgs();
            Parameter[] parameters = method.getParameters();
            
            boolean parameterFound = false;
            
            for (int i = 0; i < parameters.length; i++) {
                Parameter parameter = parameters[i];
                if (parameter.isAnnotationPresent(ValidateSelfOrHasRole.class) && args[i] instanceof UUID) {
                    parameterFound = true;
                    
                    // 본인의 데이터면 접근 허용
                    if (currentUser.getId().equals(args[i])) {
                        return joinPoint.proceed();
                    }
                    
                    // ValidateSelfOrHasRole 어노테이션에서 파라미터 수준의 minimumRole 가져오기
                    ValidateSelfOrHasRole paramAnnotation = parameter.getAnnotation(ValidateSelfOrHasRole.class);
                    UserRole paramMinimumRole = paramAnnotation.value();
                    
                    // 본인이 아니라면 최소 역할 확인
                    UserRole userRole = currentUser.getRole();
                    if (userRole.ordinal() < paramMinimumRole.ordinal()) {
                        throw ErrorStatus.FORBIDDEN.asException();
                    }
                }
            }
            
            if (!parameterFound) {
                // 파라미터에 어노테이션이 없는 경우 메소드 레벨의 최소 역할 확인
                UserRole userRole = currentUser.getRole();
                if (userRole.ordinal() < minimumRole.ordinal()) {
                    throw ErrorStatus.FORBIDDEN.asException();
                }
            }
        }

        return joinPoint.proceed();
    }

    /**
     * 파라미터 이름으로 값을 찾는 유틸리티 메소드
     */
    private Object getParameterValueByName(JoinPoint joinPoint, String paramName) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();
        
        for (int i = 0; i < parameterNames.length; i++) {
            if (parameterNames[i].equals(paramName)) {
                return args[i];
            }
        }
        
        log.error("Parameter not found: {}", paramName);
        throw ErrorStatus.SERVER_ERROR.asException();
    }
}
