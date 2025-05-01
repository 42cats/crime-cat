package com.crimecat.backend.auth.jwt;

import java.time.Duration;
import java.util.Base64;
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

    @Value("${spring.oauth.refresh-token-expire-days}")
    private int refreshTokenExpireDay;
    @Value("${spring.oauth.access-token-expire-minutes}")
    private int accessTokenExpireMinutes;


    /**
     * Access 토큰 생성
     */
    public String createAccessToken(String userId, String nickname, String discordUserSnowflake) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + Duration.ofMinutes(accessTokenExpireMinutes).toMillis());

        return Jwts.builder()
                .setSubject(userId)
                .claim("nickname", nickname)
                .claim("UserDiscordSnowflake", discordUserSnowflake)
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
        Date expiry = new Date(now.getTime() + Duration.ofDays(refreshTokenExpireDay).toMillis());

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
     * 토큰에서 nickname 추출
     */
    public String getNicknameFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("nickname", String.class);
    }

    public String getUserDiscordSnowflakeFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.get("UserDiscordSnowflake", String.class);
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
        byte[] keyBytes = Base64.getDecoder().decode(secretKeyString);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public long getRefreshTokenValidity() {
        return Duration.ofDays(refreshTokenExpireDay).toMillis();
    }

    public long getAccessTokenValidity() {
        return Duration.ofMinutes(accessTokenExpireMinutes).toMillis();
    }

    public boolean isTokenExpired(String token) {
        return getRemainingTime(token) < 0;
    }
}
