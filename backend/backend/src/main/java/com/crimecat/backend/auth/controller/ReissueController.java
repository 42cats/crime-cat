package com.crimecat.backend.auth.controller;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.service.RefreshTokenService;
import com.crimecat.backend.auth.util.TokenCookieUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class ReissueController {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final WebUserRepository webUserRepository;

    @PostMapping("/reissue")
    public ResponseEntity<?> reissue(HttpServletRequest request, HttpServletResponse response) {
        // 1. 쿠키에서 RefreshToken 추출
        String refreshToken = null;
        for (Cookie cookie : Optional.ofNullable(request.getCookies()).orElse(new Cookie[0])) {
            if (cookie.getName().equals("RefreshToken")) {
                refreshToken = cookie.getValue();
                break;
            }
        }

        if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("RefreshToken이 유효하지 않음");
        }

        // 2. userId 추출
        String userId = jwtTokenProvider.getUserIdFromToken(refreshToken);

        // 3. Redis에 저장된 리프레시 토큰과 비교
        String storedToken = refreshTokenService.getRefreshToken(userId);
        if (!refreshToken.equals(storedToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("RefreshToken 불일치");
        }

        // 4. 유저 정보 조회
        WebUser webUser = webUserRepository.findWebUserByDiscordUserId(userId)
                .orElseThrow(() -> new RuntimeException("유저 정보 없음"));

        // 5. 새 토큰 발급
        String newAccessToken = jwtTokenProvider.createAccessToken(userId, webUser.getNickname());
        String newRefreshToken = jwtTokenProvider.createRefreshToken(userId);
        refreshTokenService.saveRefreshToken(userId, newRefreshToken); // 갱신

        // 6. 쿠키 생성 및 응답에 추가 (유틸 사용)
        TokenCookieUtil.setAuthCookies(response,newAccessToken,newRefreshToken);
        return ResponseEntity.ok("토큰 재발급 성공");
    }
}
