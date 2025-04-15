package com.crimecat.backend.auth.controller;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.service.JwtBlacklistService;
import com.crimecat.backend.auth.service.RefreshTokenService;
import com.crimecat.backend.auth.util.TokenCookieUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.security.Principal;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final JwtBlacklistService jwtBlacklistService;
    private final WebUserRepository webUserRepository;

    @GetMapping("/login-success")
    public void redirectLoginSuccess(HttpServletResponse response, Principal principal) throws IOException {
        String discordUserId = principal.getName();
        log.info("🔐 [OAuth 로그인 성공] 사용자 ID: {}", discordUserId);

        WebUser webUser = webUserRepository.findWebUserByDiscordUserId(discordUserId)
                .orElseThrow(() -> new IllegalArgumentException("해당 유저 없음"));
        log.info("🔍 [유저 확인 완료] 닉네임: {}", webUser.getNickname());

        String accessToken = jwtTokenProvider.createAccessToken(discordUserId, webUser.getNickname());
        String refreshToken = jwtTokenProvider.createRefreshToken(discordUserId);
        log.info("✅ [토큰 발급 완료]");

        refreshTokenService.saveRefreshToken(discordUserId, refreshToken);
        log.info("💾 [RefreshToken 저장 완료]");

        response.addCookie(TokenCookieUtil.createAccessCookie(accessToken));
        response.addCookie(TokenCookieUtil.createRefreshCookie(refreshToken));
        log.info("🍪 [쿠키 설정 완료]");

        response.sendRedirect("http://localhost:8081/");
        log.info("➡️ [프론트로 리다이렉트] http://localhost:8081/");
    }

    @PostMapping("/login-success")
    public ResponseEntity<?> issueToken(HttpServletResponse response, @RequestParam String discordUserId) {
        log.info("🔐 [토큰 요청] 사용자 ID: {}", discordUserId);

        WebUser webUser = webUserRepository.findWebUserByDiscordUserId(discordUserId)
                .orElseThrow(() -> new IllegalArgumentException("해당 유저 없음"));
        log.info("🔍 [유저 확인 완료] 닉네임: {}", webUser.getNickname());

        String accessToken = jwtTokenProvider.createAccessToken(discordUserId, webUser.getNickname());
        String refreshToken = jwtTokenProvider.createRefreshToken(discordUserId);
        log.info("✅ [토큰 발급 완료]");

        refreshTokenService.saveRefreshToken(discordUserId, refreshToken);
        log.info("💾 [RefreshToken 저장 완료]");

        response.addCookie(TokenCookieUtil.createAccessCookie(accessToken));
        response.addCookie(TokenCookieUtil.createRefreshCookie(refreshToken));
        log.info("🍪 [쿠키 설정 완료]");

        return ResponseEntity.ok("https://localhost:8081");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        String accessToken = TokenCookieUtil.getCookieValue(request, "Authorization");

        if (accessToken == null || !jwtTokenProvider.validateToken(accessToken)) {
            log.warn("🚫 [사용자 정보 요청 실패] 유효하지 않은 AccessToken");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("유효하지 않은 토큰입니다.");
        }

        String userId = jwtTokenProvider.getUserIdFromToken(accessToken);
        WebUser user = webUserRepository.findWebUserByDiscordUserId(userId)
                .orElseThrow(() -> new RuntimeException("유저 정보 없음"));

        log.info("🙋 [현재 로그인 유저 요청] ID={}, nickname={}", userId, user.getNickname());
        return ResponseEntity.ok(user);
    }


    @PostMapping("/reissue")
    public ResponseEntity<?> reissue(HttpServletRequest request, HttpServletResponse response) {
        log.info("♻️ [토큰 재발급 요청]");
        String refreshToken = TokenCookieUtil.getCookieValue(request, "RefreshToken");

        if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)) {
            log.warn("❌ [토큰 재발급 실패] RefreshToken 유효하지 않음");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("RefreshToken이 유효하지 않음");
        }

        String userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        String storedToken = refreshTokenService.getRefreshToken(userId);
        if (!refreshToken.equals(storedToken)) {
            log.warn("❌ [토큰 재발급 실패] RefreshToken 불일치");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("RefreshToken 불일치");
        }

        WebUser webUser = webUserRepository.findWebUserByDiscordUserId(userId)
                .orElseThrow(() -> new RuntimeException("유저 정보 없음"));

        String newAccessToken = jwtTokenProvider.createAccessToken(userId, webUser.getNickname());
        String newRefreshToken = jwtTokenProvider.createRefreshToken(userId);
        refreshTokenService.saveRefreshToken(userId, newRefreshToken);
        log.info("✅ [새 토큰 발급 완료]");

        TokenCookieUtil.clearAuthCookies(response);
        response.addCookie(TokenCookieUtil.createAccessCookie(newAccessToken));
        response.addCookie(TokenCookieUtil.createRefreshCookie(newRefreshToken));
        log.info("🍪 [새 쿠키 설정 완료]");

        return ResponseEntity.ok("https://example.com/home");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        log.info("🚪 [로그아웃 요청]");
        String accessToken = TokenCookieUtil.getCookieValue(request, "Authorization");

        if (accessToken != null && jwtTokenProvider.validateToken(accessToken)) {
            String userId = jwtTokenProvider.getUserIdFromToken(accessToken);
            refreshTokenService.deleteRefreshToken(userId);
            long expiration = jwtTokenProvider.getRemainingTime(accessToken);
            jwtBlacklistService.blacklistToken(accessToken, expiration);
            log.info("✅ [토큰 블랙리스트 처리 완료] userId: {}", userId);
        } else {
            log.warn("⚠️ [유효한 액세스 토큰 없음]");
        }

        TokenCookieUtil.clearAuthCookies(response);
        log.info("🧹 [쿠키 제거 완료]");

        return ResponseEntity.ok("https://example.com/logout-complete");
    }
}
