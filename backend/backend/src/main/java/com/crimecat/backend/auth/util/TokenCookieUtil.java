package com.crimecat.backend.auth.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
public class TokenCookieUtil {

    private static final int ACCESS_TOKEN_EXPIRE_SEC = 60 * 60;           // 1시간
    private static final int REFRESH_TOKEN_EXPIRE_SEC = 7 * 24 * 60 * 60; // 7일

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
    public static Cookie createAccessCookie(String accessToken) {
        Cookie cookie = new Cookie("Authorization", accessToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(ACCESS_TOKEN_EXPIRE_SEC);
        return cookie;
    }

    // ✅ Refresh 토큰 쿠키 생성
    public static Cookie createRefreshCookie(String refreshToken) {
        Cookie cookie = new Cookie("RefreshToken", refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(REFRESH_TOKEN_EXPIRE_SEC);
        return cookie;
    }

    // ✅ 한번에 설정
    public static void setAuthCookies(Cookie accessCookie, Cookie refreshCookie) {
        // 이 메서드를 부르는 쪽(Controller)에서 response.addCookie(...)를 호출할 수도 있음
        // 상황에 따라 바로 적용하려면 인자에 HttpServletResponse response도 받으면 됨
    }
}
