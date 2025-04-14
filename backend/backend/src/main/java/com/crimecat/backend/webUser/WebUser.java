package com.crimecat.backend.webUser;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity
@Table(name = "web_users")
@Getter @Setter
@NoArgsConstructor
public class WebUser {

    @Id
    @UuidGenerator
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;  // ✅ UUID 타입 + BINARY(16)

    @Column(name = "user_id", length = 36)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "login_method", nullable = false)
    private LoginMethod loginMethod = LoginMethod.LOCAL;

    @Column(unique = true, length = 100)
    private String email;

    @Column(name = "email_verified")
    private Boolean emailVerified = false;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(name = "profile_image_path")
    private String profileImagePath;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.USER;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(columnDefinition = "JSON")
    private String settings;

    @Column(name = "social_links", columnDefinition = "JSON")
    private String socialLinks;

}
