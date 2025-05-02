package com.crimecat.backend.utils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class TokenCookieUtil {
    private static String appDomain;
    private static int accessTokenExpireMinutes;
    private static int refreshTokenExpireDay;

    @Autowired
    public TokenCookieUtil(
        @Value("${spring.domain}") String domain,
        @Value("${spring.oauth.access-token-expire-minutes}") int accessExpire,
        @Value("${spring.oauth.refresh-token-expire-days}") int refreshExpire) {
        appDomain = domain;
        accessTokenExpireMinutes = accessExpire;
        refreshTokenExpireDay = refreshExpire;
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

    // ✅ Access 토큰 쿠키 생성
    public static String createAccessCookie(String accessToken) {
        ResponseCookie cookie = ResponseCookie.from("Authorization", accessToken)
            .httpOnly(true)
            .secure(true)
            .path("/")
            .maxAge(Duration.ofMinutes(accessTokenExpireMinutes))
           .domain(appDomain) /// 개발시 제외 서비스시 활성
           .sameSite("Strict")  // 또는 "Lax", "Lax"
            .build();
        return cookie.toString();
    }

    // ✅ Refresh 토큰 쿠키 생성
    public static String createRefreshCookie(String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from("RefreshToken", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(Duration.ofDays(refreshTokenExpireDay))
               .domain(appDomain)/// 개발시 제외 서비스시 활성
               .sameSite("Strict")  // 또는 "Lax", "None"
                .build();
        return cookie.toString();
    }

    public static void clearAuthCookies(HttpServletResponse response) {
        // 1) Authorization 쿠키 제거
        ResponseCookie clearAccess = ResponseCookie.from("Authorization", "")
            .path("/")
            .maxAge(0)
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .build();

        // 2) RefreshToken 쿠키 제거
        ResponseCookie clearRefresh = ResponseCookie.from("RefreshToken", "")
            .path("/")
            .maxAge(0)
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .build();

        // 3) CSRF 토큰 쿠키 제거
        ResponseCookie clearCsrf = ResponseCookie.from("XSRF-TOKEN", "")
            .path("/")
            .maxAge(0)
            .httpOnly(false)
            .secure(true)
            .sameSite("Strict")
            .build();

        // 4) JSESSIONID 쿠키 제거 (세션 사용 시)
        ResponseCookie clearSession = ResponseCookie.from("JSESSIONID", "")
            .path("/")
            .maxAge(0)
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .build();

        response.addHeader(HttpHeaders.SET_COOKIE, clearAccess.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearRefresh.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearCsrf.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearSession.toString());
    }


}
