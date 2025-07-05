package com.crimecat.backend.utils;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class TokenCookieUtil {

    private final Environment env;
    private static boolean isProd;
    private static String appDomain;
    private static int accessTokenExpireMinutes;
    private static int refreshTokenExpireDays;
    private static boolean cookieDomainEnabled;
    private static String sameSitePolicy;

    public TokenCookieUtil(
        Environment env,
        @Value("${spring.domain}") String domain,
        @Value("${spring.oauth.access-token-expire-minutes}") int accessExpire,
        @Value("${spring.oauth.refresh-token-expire-days}") int refreshExpire,
        @Value("${app.cookie.domain-enabled:${SPRING_COOKIE_DOMAIN_ENABLED:true}}") boolean domainEnabled,
        @Value("${app.cookie.samesite-policy:${SPRING_COOKIE_SAMESITE_POLICY:Strict}}") String samesite
    ) {
        this.env = env;
        appDomain = domain;
        accessTokenExpireMinutes = accessExpire;
        refreshTokenExpireDays = refreshExpire;
        cookieDomainEnabled = domainEnabled;
        sameSitePolicy = samesite;
    }

    @PostConstruct
    private void init() {
        isProd = Arrays.asList(env.getActiveProfiles()).contains("prod");
    }

    // 쿠키에서 특정 이름의 값 꺼내기
    public static String getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if (cookie.getName().equals(name)) {
                return cookie.getValue();
            }
        }
        return null;
    }

    // 쿠키 삭제
    public static void clearCookie(HttpServletResponse response, String name) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, "")
            .path("/")
            .maxAge(0);

        if (isProd) {
            builder
                .httpOnly(true)
                .secure(true)
                .sameSite(sameSitePolicy);
            
            // 외부 IP 접속시 도메인 설정 조건부 적용
            if (cookieDomainEnabled) {
                builder.domain(appDomain);
            }
        }

        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    // Access 토큰 쿠키 생성
    public static String createAccessCookie(String accessToken) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from("Authorization", accessToken)
            .path("/")
            .maxAge(Duration.ofMinutes(accessTokenExpireMinutes));

        if (isProd) {
            builder
                .httpOnly(true)
                .secure(true)
                .sameSite(sameSitePolicy);
            
            // 외부 IP 접속시 도메인 설정 조건부 적용
            if (cookieDomainEnabled) {
                builder.domain(appDomain);
            }
        }

        return builder.build().toString();
    }

    // Refresh 토큰 쿠키 생성
    public static String createRefreshCookie(String refreshToken) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from("RefreshToken", refreshToken)
            .path("/")
            .maxAge(Duration.ofDays(refreshTokenExpireDays));

        if (isProd) {
            builder
                .httpOnly(true)
                .secure(true)
                .sameSite(sameSitePolicy);
            
            // 외부 IP 접속시 도메인 설정 조건부 적용
            if (cookieDomainEnabled) {
                builder.domain(appDomain);
            }
        }

        return builder.build().toString();
    }

    // Authorization 관련 모든 쿠키 삭제
    public static void clearAuthCookies(HttpServletResponse response) {
        clearCookie(response, "Authorization");
        clearCookie(response, "RefreshToken");
        clearCookie(response, "XSRF-TOKEN");
    }
}
