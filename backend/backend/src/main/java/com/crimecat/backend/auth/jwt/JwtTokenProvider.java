package com.crimecat.backend.auth.jwt;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    // 예: application.yml 에서
    // app:
    //   jwt:
    //     secret: "길고 복잡한 시크릿키..."
    @Value("${spring.jwt.secret}")
    private String secretKeyString;

    // 만료 시간 통일 (Access 1시간, Refresh 7일)
    private final long accessTokenValidity = 1000L * 60 * 60;      // 1시간
    private final long refreshTokenValidity = 1000L * 60 * 60 * 24 * 7; // 7일

    /**
     * Access 토큰 생성
     */
    public String createAccessToken(String userId, String nickname) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenValidity);

        return Jwts.builder()
                .setSubject(userId)
                .claim("nickname", nickname)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Refresh 토큰 생성
     */
    public String createRefreshToken(String userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshTokenValidity);

        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * 토큰 유효성 검사
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * 토큰에서 userId 추출
     */
    public String getUserIdFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.getSubject();
    }

    /**
     * 만료까지 남은 시간
     */
    public long getRemainingTime(String token) {
        Date expiration = getClaims(token).getExpiration();
        return expiration.getTime() - System.currentTimeMillis();
    }

    /**
     * 내부 유틸
     */
    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private SecretKey getSigningKey() {
        // base64 디코딩 + hmacShaKeyFor
        return Keys.hmacShaKeyFor(secretKeyString.getBytes());
    }

    public long getRefreshTokenValidity() {
        return refreshTokenValidity;
    }

    public long getAccessTokenValidity() {
        return accessTokenValidity;
    }

}
