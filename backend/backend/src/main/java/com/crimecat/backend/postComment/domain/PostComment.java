package com.crimecat.backend.postComment.domain;

import com.crimecat.backend.post.domain.Post;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "POST_COMMENTS")
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PostComment {
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "CONTENT", columnDefinition = "TEXT")
    private String content;

    @Column(name = "USER")
    private UUID userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "USER", updatable = false, insertable = false)
    private WebUser user;

    @Column(name = "POST")
    private UUID postId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "POST", updatable = false, insertable = false)
    private Post post;

    // 부모 댓글 (대댓글인 경우)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "PARENT")
    private UUID parentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PARENT", updatable = false, insertable = false)
    private PostComment parent;

    @Builder.Default
    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @Builder.Default
    @Column(name = "IS_DELETED")
    private Boolean isDeleted = false;

    @Column(name = "SECRET")
    private Boolean secret;
}
