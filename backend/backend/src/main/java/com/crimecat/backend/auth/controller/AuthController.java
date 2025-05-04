package com.crimecat.backend.auth.controller;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.service.JwtBlacklistService;
import com.crimecat.backend.auth.service.RefreshTokenService;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.utils.TokenCookieUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final JwtBlacklistService jwtBlacklistService;
    private final WebUserRepository webUserRepository;

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
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asControllerException);

        Map<String, String> UserAuthInfo = getStringStringMap(user);

        return ResponseEntity.ok(UserAuthInfo);
    }


    @PostMapping("/reissue")
    public ResponseEntity<?> reissue(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = TokenCookieUtil.getCookieValue(request, "RefreshToken");
        // 1) 토큰이 없거나 검증 실패
        if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)) {
            TokenCookieUtil.clearAuthCookies(response);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("RefreshToken이 유효하지 않음");
        }

        String userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        String stored = refreshTokenService.getRefreshToken(userId);
        // 2) 저장소 불일치 시 → 완전 세션 종료
        if (!refreshToken.equals(stored)) {
            // 2-1) 서버 저장소에서 리프레시 토큰 제거
            refreshTokenService.deleteRefreshToken(userId);
            // 2-2) 블랙리스트에 기록 (만료시간 계산)
            long expiry = jwtTokenProvider.getRemainingTime(refreshToken);
            jwtBlacklistService.blacklistToken(refreshToken, expiry);
            // 2-3) 쿠키 삭제
            TokenCookieUtil.clearAuthCookies(response);

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("RefreshToken 불일치 – 재로그인 필요");
        }
        Optional<WebUser> optionalWebUser = webUserRepository.findById(UUID.fromString(userId));
        if(optionalWebUser.isEmpty()){
            TokenCookieUtil.clearAuthCookies(response);
            throw ErrorStatus.USER_NOT_FOUND.asControllerException();
        }
        WebUser webUser = optionalWebUser.get();
        String accessToken = jwtTokenProvider.createAccessToken(webUser.getId()
            .toString(), webUser.getNickname(), webUser.getDiscordUserSnowflake());
        response.addHeader(HttpHeaders.SET_COOKIE,TokenCookieUtil.createAccessCookie(accessToken));
        Map<String, String> userAuthInfo = getStringStringMap(webUser);
        return ResponseEntity.ok(userAuthInfo);
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
    private static Map<String, String> getStringStringMap(WebUser user) {
        Map<String,String> resp  = new HashMap<>();
        // 필수 값
        resp.put("id", user.getId().toString());
        resp.put("nickname", user.getNickname());
        resp.put("profile_image_path", user.getProfileImagePath());
        resp.put("setting", user.getSettings());
        resp.put("bio", user.getBio());
        resp.put("role", user.getRole().name());
        resp.put("is_active", user.getIsActive().toString());
        resp.put("last_login_at",user.getLastLoginAt().toString());
        resp.put("snowflake", user.getDiscordUserSnowflake());
        resp.put("point", user.getPoint().toString());
        // Optional 값은 null 체크 후에만 put
        if (user.getSocialLinks() != null) {
            resp.put("social_links", user.getSocialLinks());
        }
        return resp;
        }
}
