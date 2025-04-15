package com.crimecat.backend.auth.controller;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.service.JwtBlacklistService;
import com.crimecat.backend.auth.service.RefreshTokenService;
import com.crimecat.backend.auth.util.TokenCookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class LogoutController {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final JwtBlacklistService jwtBlacklistService;

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        String accessToken = TokenCookieUtil.getCookieValue(request, "Authorization");

        if (accessToken != null && jwtTokenProvider.validateToken(accessToken)) {
            String userId = jwtTokenProvider.getUserIdFromToken(accessToken);
            refreshTokenService.deleteRefreshToken(userId); // ✅ Redis에서 삭제
        }

        long expiration = jwtTokenProvider.getRemainingTime(accessToken);
        jwtBlacklistService.blacklistToken(accessToken, expiration);

        TokenCookieUtil.clearAuthCookies(response); // ✅ 쿠키 제거
        return ResponseEntity.ok("로그아웃 성공");
    }
}
