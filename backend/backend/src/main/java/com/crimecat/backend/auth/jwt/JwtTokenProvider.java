package com.crimecat.backend.auth.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long accessTokenValidity = 1000L * 60 * 60; // 1시간
    private final long refreshTokenValidity = 1000L * 60 * 60 * 24 * 7; // 7일

    public JwtTokenProvider() {
        // 길이가 충분히 긴 secret key 필요 (HS256용)
        this.key = SecretKeyGenerator();
    }
    public SecretKey SecretKeyGenerator() {
        String base = "crime-cat-super-secret-and-very-very-strong-key-please-don't-share";

        // UUID 3개를 붙여 문자열 생성
        StringBuilder secretBuilder = new StringBuilder(base);
        for (int i = 0; i < 3; i++) {
            secretBuilder.append("-").append(UUID.randomUUID());
        }

        // 문자열을 UTF-8로 바이트 변환 → base64 인코딩 → byte[] 로 변환하여 hmac 키 생성
        byte[] base64Encoded = Base64.getEncoder()
                .encode(secretBuilder.toString().getBytes(StandardCharsets.UTF_8));

        return Keys.hmacShaKeyFor(base64Encoded);
    }

    public SecretKey getKey() {
        return key;
    }

    // ✅ 액세스 토큰 생성
    public String createAccessToken(String userId, String nickname) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenValidity);

        return Jwts.builder()
                .setSubject(userId)
                .claim("nickname", nickname)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // ✅ 리프레시 토큰 생성
    public String createRefreshToken(String userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshTokenValidity);

        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // ✅ 토큰에서 사용자 ID 추출
    public String getUserIdFromToken(String token) {
        return String.valueOf(Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject());
    }

    // ✅ 토큰 유효성 검사
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public long getRemainingTime(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        Date expiration = claims.getExpiration();
        return expiration.getTime() - System.currentTimeMillis();
    }

    // ✅ 쿠키에서 토큰 추출
    public String extractTokenFromCookie(HttpServletRequest request, String cookieName) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if (cookie.getName().equals(cookieName)) {
                return cookie.getValue();
            }
        }
        return null;
    }
    // ✅ 토큰에서 nickname 추출
    public String extractNickname(String token) {
        return (String) getClaims(token).get("nickname");
    }

    // ✅ 토큰에서 특정 claim 추출
    public Object getClaim(String token, String claimKey) {
        return getClaims(token).get(claimKey);
    }

    // ✅ Claims 추출 유틸
    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public long getRefreshTokenValidity() {
        return refreshTokenValidity;
    }

    public long getAccessTokenValidity() {
        return accessTokenValidity;
    }

}
