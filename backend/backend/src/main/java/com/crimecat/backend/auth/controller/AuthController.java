package com.crimecat.backend.auth.controller;

import java.io.IOException;
import java.security.Principal;
import java.util.Map;
import java.util.UUID;

import com.crimecat.backend.auth.service.DiscordRedisTokenService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.service.JwtBlacklistService;
import com.crimecat.backend.auth.service.RefreshTokenService;
import com.crimecat.backend.auth.util.TokenCookieUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final JwtBlacklistService jwtBlacklistService;
    private final WebUserRepository webUserRepository;
    private final DiscordRedisTokenService discordRedisTokenService;

    @GetMapping("/login-success")
    public ResponseEntity<?> redirectLoginSuccess(HttpServletResponse response, Principal principal) throws IOException {
        String webUserId = principal.getName();
        log.info("🔐 [OAuth 로그인 성공] 사용자 ID: {}", webUserId);

        WebUser webUser = webUserRepository.findById(UUID.fromString(webUserId))
                .orElseThrow(() -> new IllegalArgumentException("해당 유저 없음"));
        log.info("🔍 [유저 확인 완료] 닉네임: {}", webUser.getNickname());
        
        String accessToken = jwtTokenProvider.createAccessToken(webUserId, webUser.getNickname(),webUser.getDiscordUserSnowflake());
        String refreshToken = jwtTokenProvider.createRefreshToken(webUserId);
        log.info("✅ [토큰 발급 완료]");

        refreshTokenService.saveRefreshToken(webUserId, refreshToken);
        log.info("💾 [RefreshToken 저장 완료]");

        response.addHeader(HttpHeaders.SET_COOKIE,TokenCookieUtil.createAccessCookie(accessToken));
        response.addHeader(HttpHeaders.SET_COOKIE,TokenCookieUtil.createRefreshCookie(refreshToken));
        log.info("🍪 [쿠키 설정 완료]");
        return ResponseEntity.ok(Map.of(
                "nickname", webUser.getNickname(),
                "message", "로그인 성공"
        ));
    }

    @PostMapping("/login-success")
    public ResponseEntity<?> issueToken(HttpServletResponse response, Principal principal) {
        String webUserId = principal.getName();
        log.info("🔐 [토큰 요청] 사용자 ID: {}", principal.getName());

        WebUser webUser = webUserRepository.findById(UUID.fromString(webUserId))
                .orElseThrow(() -> new IllegalArgumentException("해당 유저 없음"));
        log.info("🔍 [유저 확인 완료] 닉네임: {}", webUser.getNickname());

        String accessToken = jwtTokenProvider.createAccessToken(webUserId, webUser.getNickname(),webUser.getDiscordUserSnowflake());
        String refreshToken = jwtTokenProvider.createRefreshToken(webUserId);
        log.info("✅ [토큰 발급 완료]");

        refreshTokenService.saveRefreshToken(webUserId, refreshToken);
        log.info("💾 [RefreshToken 저장 완료]");

        response.addHeader(HttpHeaders.SET_COOKIE, TokenCookieUtil.createAccessCookie(accessToken));
        response.addHeader(HttpHeaders.SET_COOKIE, TokenCookieUtil.createRefreshCookie(refreshToken));
        log.info("🍪 [쿠키 설정 완료]");

        return ResponseEntity.ok(Map.of(
                "nickname", webUser.getNickname(),
                "message", "토큰 발급 완료"
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        String accessToken = TokenCookieUtil.getCookieValue(request, "Authorization");

        if (accessToken == null || !jwtTokenProvider.validateToken(accessToken)) {
            log.warn("🚫 [사용자 정보 요청 실패] 유효하지 않은 AccessToken");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("유효하지 않은 토큰입니다.");
        }

        String userId = jwtTokenProvider.getUserIdFromToken(accessToken);
        WebUser user = webUserRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("유저 정보 없음"));

        log.info("🙋 [현재 로그인 유저 요청] ID={}, nickname={}", userId, user.getNickname());
        return ResponseEntity.ok(Map.of(
                "nickname", user.getNickname(),
                "message", "인증 성공"
        ));
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

        WebUser webUser = webUserRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("유저 정보 없음"));

        String newAccessToken = jwtTokenProvider.createAccessToken(userId, webUser.getNickname(),webUser.getDiscordUserSnowflake());
        String newRefreshToken = jwtTokenProvider.createRefreshToken(userId);
        refreshTokenService.saveRefreshToken(userId, newRefreshToken);
        log.info("✅ [새 토큰 발급 완료]");

        TokenCookieUtil.clearAuthCookies(response);
        response.addHeader(HttpHeaders.SET_COOKIE, TokenCookieUtil.createAccessCookie(newAccessToken));
        response.addHeader(HttpHeaders.SET_COOKIE, TokenCookieUtil.createRefreshCookie(newRefreshToken));
        log.info("🍪 [쿠키 설정 완료]");

        return ResponseEntity.ok(Map.of(
                "nickname", webUser.getNickname(),
                "message", "토큰 갱신 성공"
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        log.info("🚪 [로그아웃 요청]");
        String accessToken = TokenCookieUtil.getCookieValue(request, "Authorization");

        String nickname = "";
        if (accessToken != null && jwtTokenProvider.validateToken(accessToken)) {
            String userId = jwtTokenProvider.getUserIdFromToken(accessToken);
            nickname = jwtTokenProvider.getNicknameFromToken(accessToken);
            refreshTokenService.deleteRefreshToken(userId);
            long expiration = jwtTokenProvider.getRemainingTime(accessToken);
            jwtBlacklistService.blacklistToken(accessToken, expiration);
            log.info("✅ [토큰 블랙리스트 처리 완료] userId: {}", userId);
            discordRedisTokenService.deleteAccessToken(userId);
            log.info("✅ [디스코드 토큰 삭제 처리 완료] userId: {}", userId);
        } else {
            log.warn("⚠️ [유효한 액세스 토큰 없음]");
        }

        TokenCookieUtil.clearAuthCookies(response);
        log.info("🧹 [쿠키 제거 완료]");

        return ResponseEntity.ok(Map.of(
                "nickname", nickname,
                "message", "로그아웃 성공"
        ));
    }
}
