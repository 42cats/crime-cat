package com.crimecat.backend.userPost.domain;

import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_post_likes", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_post_likes_user_post", columnNames = {"user_id", "post_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserPostLike {

    @Id
    @UuidGenerator
    @GeneratedValue
    @Getter
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_post_likes_user"))
    private WebUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_post_likes_post"))
    private UserPost post;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public void setUser(WebUser user) {
        this.user = user;
    }

    public void setPost(UserPost post) {
        this.post = post;
    }

    static public UserPostLike from(WebUser user, UserPost post) {
        return UserPostLike.builder()
                .post(post)
                .user(user)
                .build();
    }
}
