package com.crimecat.backend.userPost.domain.saved;

import com.crimecat.backend.userPost.domain.UserPost;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "saved_posts", uniqueConstraints = {
        @UniqueConstraint(name = "uk_saved_posts_user_post", columnNames = {"user_id", "post_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class SavedPost {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_saved_posts_user"))
    private WebUser user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false, foreignKey = @ForeignKey(name = "fk_saved_posts_post"))
    private UserPost post;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    // Collection 기능 (사용자가 저장한 게시물을 카테고리별로 저장할 수 있음)
    @Column(name = "collection_name")
    private String collectionName;
    
    public static SavedPost from(WebUser user, UserPost post) {
        return SavedPost.builder()
                .user(user)
                .post(post)
                .build();
    }
    
    public static SavedPost from(WebUser user, UserPost post, String collectionName) {
        return SavedPost.builder()
                .user(user)
                .post(post)
                .collectionName(collectionName)
                .build();
    }
    
    public void setCollectionName(String collectionName) {
        this.collectionName = collectionName;
    }
}
