package com.crimecat.backend.webUser.domain;

import com.crimecat.backend.webUser.LoginMethod;
import com.crimecat.backend.webUser.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "web_users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebUser implements UserDetails {

    // ✅ 고유 ID (UUID → BINARY(16) 저장)
    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    // ✅ Discord OAuth 연동용 ID (Snowflake 문자열)
    @Column(name = "discord_user_id", length = 50, unique = true)
    private String discordUserId;

    // ✅ 로그인 방식 (LOCAL, GOOGLE, DISCORD 등)
    @Enumerated(EnumType.STRING)
    @Column(name = "login_method", nullable = false)
    private LoginMethod loginMethod = LoginMethod.LOCAL;

    // ✅ 이메일 정보 및 인증 여부
    @Column(name = "email", unique = true, length = 100)
    private String email;

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
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.USER;

    // ✅ 계정 활성 여부 (정지 여부)
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // ✅ 마지막 로그인 시각
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    // ✅ 계정 생성 시각 (자동 설정)
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ✅ 사용자 설정 (JSON 형식)
    @Column(columnDefinition = "JSON")
    private String settings;

    // ✅ SNS 링크들 (JSON)
    @Column(name = "social_links", columnDefinition = "JSON")
    private String socialLinks;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if(role == null)this.role =  UserRole.USER;
    }

    // ✅ Spring Security 용 권한 반환
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    // ✅ 비밀번호 반환 (LOCAL 로그인일 경우에만 의미 있음)
    @Override
    public String getPassword() {
        return passwordHash != null ? passwordHash : "";
    }

    // ✅ 사용자명 (UserDetails 기준 → 여기선 nickname 사용)
    @Override
    public String getUsername() {
        return nickname;
    }

    // ✅ 계정 만료 여부 (true면 만료 안됨)
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // ✅ 계정 잠김 여부 (true면 잠김 아님)
    @Override
    public boolean isAccountNonLocked() {
        return true;
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
}
