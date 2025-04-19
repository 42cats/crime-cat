package com.crimecat.backend.auth.util;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class TokenCookieUtil {


    private static int ACCESS_TOKEN_EXPIRE_MINUTES;           // 분
    private static int REFRESH_TOKEN_EXPIRE_DAY; // 일

    private static String appDomain;

    @Component
    public static class DomainHolder {
        @Value("${spring.oauth.refresh-token-expire-days}")
        private int refreshTokenExpireDay;
        @Value("${spring.oauth.access-token-expire-minutes}")
        private int accessTokenExpireMinutes;

        @PostConstruct
        public void init() {
            TokenCookieUtil.ACCESS_TOKEN_EXPIRE_MINUTES = accessTokenExpireMinutes;
            TokenCookieUtil.REFRESH_TOKEN_EXPIRE_DAY = refreshTokenExpireDay;

        }
    }
    // ✅ 쿠키에서 특정 이름의 값 꺼내기
    public static String getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if (cookie.getName().equals(name)) {
                return cookie.getValue();
            }
        }
        return null;
    }

    // ✅ 쿠키 삭제
    public static void clearCookie(HttpServletResponse response, String name) {
        Cookie cookie = new Cookie(name, null);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    // ✅ 인증 관련 쿠키 전부 제거
    public static void clearAuthCookies(HttpServletResponse response) {
        clearCookie(response, "Authorization");
        clearCookie(response, "RefreshToken");
    }

    // ✅ Access 토큰 쿠키 생성
    public static String createAccessCookie(String accessToken) {
        ResponseCookie cookie = ResponseCookie.from("Authorization", accessToken)
            .httpOnly(true)
            .secure(true)
            .path("/")
            .maxAge(Duration.ofMinutes(ACCESS_TOKEN_EXPIRE_MINUTES))
//                .domain(appDomain) /// 개발시 제외 서비스시 활성
            .build();
        return cookie.toString();
    }

    // ✅ Refresh 토큰 쿠키 생성
    public static String createRefreshCookie(String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from("RefreshToken", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(Duration.ofDays(REFRESH_TOKEN_EXPIRE_DAY))
//                .domain(appDomain)/// 개발시 제외 서비스시 활성
                .build();
        return cookie.toString();
    }

}
