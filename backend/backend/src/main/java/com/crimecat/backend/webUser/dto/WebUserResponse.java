package com.crimecat.backend.webUser.dto;

import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * WebUser 정보를 클라이언트에 응답하기 위한 DTO 클래스
 * 관리자 페이지에서 사용자 목록 조회 및 권한 관리에 사용됩니다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebUserResponse {

    private UUID id;                   // 사용자 ID
    private String nickname;           // 닉네임
    private String email;              // 이메일 주소
    private UserRole role;             // 사용자 역할 (USER, MANAGER, ADMIN)
    private boolean isBlocked;         // 차단 여부
    private String blockReason;        // 차단 사유
    private LocalDateTime blockedAt;   // 차단 시작 시간
    private LocalDateTime blockExpiresAt; // 차단 만료 시간
    private String profileImagePath;   // 프로필 이미지 경로
    private Integer points;            // 보유 포인트
    private LocalDateTime createdAt;   // 가입일
    private LocalDateTime lastLoginAt; // 마지막 로그인 시간
    private String discordSnowflake;   // 디스코드 ID (연동된 경우)

    /**
     * WebUser 엔티티를 WebUserResponse DTO로 변환하는 정적 팩토리 메서드
     * 
     * @param webUser WebUser 엔티티
     * @return WebUserResponse DTO
     */
    public static WebUserResponse from(WebUser webUser) {
        WebUserResponseBuilder builder = WebUserResponse.builder()
                .id(webUser.getId())
                .nickname(webUser.getNickname())
                .email(webUser.getEmail())
                .role(webUser.getRole())
                .isBlocked(webUser.getIsBanned())
                .blockReason(webUser.getBlockReason())
                .blockedAt(webUser.getBlockedAt())
                .blockExpiresAt(webUser.getBlockExpiresAt())
                .profileImagePath(webUser.getProfileImagePath())
                .createdAt(webUser.getCreatedAt())
                .lastLoginAt(webUser.getLastLoginAt());

        // 사용자의 포인트 정보 추가
        if (webUser.getUser() != null) {
            builder.points(webUser.getUser().getPoint());
            
            // Discord 사용자 정보가 있는 경우 Discord ID 추가
            if (webUser.getUser().getDiscordUser() != null) {
                builder.discordSnowflake(webUser.getUser().getDiscordUser().getSnowflake());
            }
        }

        return builder.build();
    }
}
