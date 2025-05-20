package com.crimecat.backend.userPost.domain;

import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.*;

import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "user_posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class UserPost {

    @Id
    @UuidGenerator
    @GeneratedValue
    @Getter
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_posts_user"))
    private WebUser user;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false, length = 500)
    private String content;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserPostImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserPostLike> likes = new ArrayList<>();

    @Column(name = "is_private")
    @Builder.Default
    @JsonProperty("isPrivate")
    private boolean isPrivate = false;

    @Column(name = "is_followers_only")
    @Builder.Default
    @JsonProperty("isFollowersOnly")
    private boolean isFollowersOnly = false;
    
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserPostComment> comments = new ArrayList<>();

    @PreUpdate
    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }

    public void setUser(WebUser user) {
        this.user = user;
    }

    public void setContent(String content) {
        this.content = content;
    }
    
    public void setIsPrivate(boolean isPrivate) {
        this.isPrivate = isPrivate;
    }
    
    public void setIsFollowersOnly(boolean isFollowersOnly) {
        this.isFollowersOnly = isFollowersOnly;
    }

    static public UserPost from(WebUser user, String content, boolean isPrivate, boolean isFollowersOnly) {
        return UserPost.builder()
                .user(user)
                .content(content)
                .isPrivate(isPrivate)
                .isFollowersOnly(isFollowersOnly)
                .build();
    }
    
    static public UserPost from(WebUser user, String content) {
        return UserPost.builder()
                .user(user)
                .content(content)
                .isPrivate(false)
                .isFollowersOnly(false)
                .build();
    }
}
