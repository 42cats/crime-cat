package com.crimecat.backend.userPost.domain;

import com.crimecat.backend.hashtag.domain.PostHashTag;
import com.crimecat.backend.userPost.domain.saved.SavedPost;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
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

    // 해시태그 관계 추가
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PostHashTag> hashtags = new ArrayList<>();

    // 저장된 게시물 관계 추가
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SavedPost> savedBy = new ArrayList<>();

    // 조회수 필드 추가
    @Column(name = "view_count")
    @Builder.Default
    private int viewCount = 0;

    // 피드에서의 인기도 점수 (알고리즘 기반)
    @Column(name = "popularity_score")
    @Builder.Default
    private double popularityScore = 0.0;

    // 위치 정보 (선택 사항)
    @Column(name = "location_name")
    private String locationName;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

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
    
    public void incrementViewCount() {
        this.viewCount++;
    }
    
    public void updatePopularityScore() {
        // 인기도 점수 계산 로직
        // 예: 좋아요 수 * 0.5 + 댓글 수 * 0.3 + 저장 수 * 0.2
        double likeWeight = 0.5;
        double commentWeight = 0.3;
        double saveWeight = 0.2;
        
        this.popularityScore = 
            this.likes.size() * likeWeight + 
            this.comments.size() * commentWeight + 
            this.savedBy.size() * saveWeight;
    }
    
    public void setLocationInfo(String locationName, Double latitude, Double longitude) {
        this.locationName = locationName;
        this.latitude = latitude;
        this.longitude = longitude;
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
    
    static public UserPost from(WebUser user, String content, String locationName, Double latitude, Double longitude) {
        UserPost post = UserPost.builder()
                .user(user)
                .content(content)
                .isPrivate(false)
                .isFollowersOnly(false)
                .build();
        
        post.setLocationInfo(locationName, latitude, longitude);
        return post;
    }
}
