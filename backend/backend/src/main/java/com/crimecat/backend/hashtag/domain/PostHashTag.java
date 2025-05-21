package com.crimecat.backend.hashtag.domain;

import com.crimecat.backend.userPost.domain.UserPost;
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
@Table(name = "post_hashtags", uniqueConstraints = {
        @UniqueConstraint(name = "uk_post_hashtags_post_hashtag", columnNames = {"post_id", "hashtag_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class PostHashTag {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private UserPost post;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hashtag_id", nullable = false)
    private HashTag hashTag;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public static PostHashTag create(UserPost post, HashTag hashTag) {
        PostHashTag postHashTag = PostHashTag.builder()
                .post(post)
                .hashTag(hashTag)
                .build();
        
        // Connect relationships
        post.getHashtags().add(postHashTag);
        hashTag.getPosts().add(postHashTag);
        hashTag.incrementUseCount();
        
        return postHashTag;
    }
    
    public void removeAssociations() {
        this.post.getHashtags().remove(this);
        this.hashTag.getPosts().remove(this);
        this.hashTag.decrementUseCount();
    }
}
