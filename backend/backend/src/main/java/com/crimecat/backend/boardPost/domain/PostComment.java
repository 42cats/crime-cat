package com.crimecat.backend.boardPost.domain;

import com.crimecat.backend.boardPost.dto.PostCommentRequest;
import com.crimecat.backend.webUser.domain.WebUser;
import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "AUTHOR_ID")
    private UUID authorId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AUTHOR_ID", referencedColumnName = "ID", updatable = false, insertable = false)
    private WebUser author;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "POST_ID")
    private UUID postId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "POST_ID", referencedColumnName = "ID", updatable = false, insertable = false)
    private BoardPost boardPost;

    // 부모 댓글 (대댓글인 경우)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "PARENT_ID")
    private UUID parentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PARENT_ID", referencedColumnName = "ID", updatable = false, insertable = false)
    private PostComment parent;

    @Builder.Default
    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @Builder.Default
    @Column(name = "LIKES")
    private Integer likes = 0;

    @Builder.Default
    @Column(name = "IS_DELETED")
    @JsonProperty("isDeleted")
    private Boolean isDeleted = false;

    @Builder.Default
    @Column(name = "IS_SECRET")
    @JsonProperty("isSecret")
    private Boolean isSecret = false;

    public void update(PostCommentRequest request) {
        this.updatedAt = LocalDateTime.now();
        this.content = request.getContent();
        this.isSecret = request.getIsSecret();
    }

    public void delete() {
        this.updatedAt = LocalDateTime.now();
        this.isDeleted = true;
    }

    public static PostComment from(BoardPost boardPost, WebUser author, PostComment parent, PostCommentRequest request){
        UUID parentId = null;
        if (parent != null) {
            parentId = parent.getId();
        }
        return PostComment.builder()
                .content(request.getContent())
                .authorId(author.getId())
                .author(author)
                .postId(boardPost.getId())
                .boardPost(boardPost)
                .parentId(parentId)
                .parent(parent)
                .isSecret(request.getIsSecret())
                .build();
    }
}
