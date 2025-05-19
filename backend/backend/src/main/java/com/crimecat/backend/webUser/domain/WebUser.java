package com.crimecat.backend.webUser.domain;

import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.webUser.dto.WebUserProfileEditRequestDto;
import com.crimecat.backend.webUser.enums.LoginMethod;
import com.crimecat.backend.webUser.enums.UserRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

@Entity
@Table(name = "web_users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebUser implements UserDetails, OAuth2User {

    // ✅ 고유 ID (UUID → BINARY(16) 저장)
    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    // ✅ Discord OAuth 연동용 ID (Snowflake 문자열)
    @Column(name = "discord_user_id", length = 50, unique = true)
    private String discordUserSnowflake;

    // ✅ 로그인 방식 (local, google, discord 등)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "login_method", nullable = false)
    private LoginMethod loginMethod = LoginMethod.LOCAL;

    // ✅ 이메일 정보 및 인증 여부
    @Column(name = "email", unique = true, length = 100)
    private String email;

    @Builder.Default
    @Column(name = "email_alarm" , nullable = false)
    private Boolean emailAlarm = false;

    @OneToOne(mappedBy = "webUser", fetch = FetchType.LAZY)
    private User user;

    @Builder.Default
    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified = false;

    // ✅ 해시된 비밀번호 (LOCAL 로그인만 사용)
    @Column(name = "password_hash")
    private String passwordHash;

    // ✅ 사용자 닉네임 (로그인 시 표시될 이름)
    @Column(name = "nickname", nullable = false, length = 50)
    private String nickname;

    // ✅ 프로필 이미지 경로
    @Column(name = "profile_image_path")
    private String profileImagePath;

    // ✅ 사용자 소개글 (BIO)
    @Column(columnDefinition = "TEXT")
    private String bio;

    // ✅ 사용자 역할 (ADMIN, USER 등)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.USER;

    // ✅ 계정 활성 여부 (정지 여부)
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(name ="is_Banned", nullable = false)
    private Boolean isBanned = false;

    // ✅ 마지막 로그인 시각
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    // ✅ 계정 생성 시각 (자동 설정)
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ✅ 사용자 설정 (JSON 형식)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSON")
    private Map<String,Object> settings;

    // ✅ SNS 링크들 (JSON)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "social_links", columnDefinition = "JSON")
    private Map<String,String> socialLinks;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if(role == null)this.role =  UserRole.USER;
    }

    // ✅ Spring Security 용 권한 반환
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    // ✅ 비밀번호 반환 (LOCAL 로그인일 경우에만 의미 있음)
    @Override
    public String getPassword() {
        return passwordHash != null ? passwordHash : "";
    }

    // ✅ 사용자명 (UserDetails 기준 → 여기선 nickname 사용)
    @Override
    public String getUsername() {
        return user != null ? user.getName() : nickname;
    }
    
    // OAuth2User 구현 메서드
    @Override
    public Map<String, Object> getAttributes() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("id", id.toString());
        attributes.put("nickname", nickname);
        attributes.put("discordId", discordUserSnowflake);
        attributes.put("email", email);
        return attributes;
    }
    
    @Override
    public String getName() {
        return id.toString();
    }

    // ✅ 계정 만료 여부 (true면 만료 안됨)
    @Override
    public boolean isAccountNonExpired() {
        return isActive;
    }

    // ✅ 계정 잠김 여부 (true면 잠김 아님)
    @Override
    public boolean isAccountNonLocked() {
        return !isBanned;
    }

    // ✅ 자격 증명 만료 여부 (true면 만료 아님)
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // ✅ 활성화 여부 (isActive 활용)
    @Override
    public boolean isEnabled() {
        return Boolean.TRUE.equals(isActive);
    }

    public Integer getPoint() {
        return user.getPoint();
    }


    public void updateProfile(WebUserProfileEditRequestDto request) {
        if(request.getNickName() != null){
            this.nickname = request.getNickName();
        }
        if (request.getSocialLinks() != null) {
            // 기존에 null 이었다면 새 맵 만들어 주기
            if (this.socialLinks == null) {
                this.socialLinks = new HashMap<>();
                this.socialLinks.put("instagram?", "");
                this.socialLinks.put("x", "");
                this.socialLinks.put("openkakao", "");
            }
            // putAll 하면 같은 key 는 덮어쓰고, 새로운 key 는 추가
            this.socialLinks.putAll(request.getSocialLinks());
        }
        if(request.getDiscordAlert() != null){
            if(getUser().getDiscordUser() != null){
                getUser().getDiscordUser().setDiscordAlarm(request.getDiscordAlert());
            }
        }
        if(request.getBio() != null){
            this.bio = request.getBio();
        }
    }

    public Map<String,String> getSocialLinks() {
    if (socialLinks == null || socialLinks.isEmpty()){
        return new HashMap<>();
    }
        return socialLinks;
    }
}
