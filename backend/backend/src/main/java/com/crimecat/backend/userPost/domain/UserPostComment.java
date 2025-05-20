package com.crimecat.backend.userPost.domain;

import com.crimecat.backend.userPost.dto.UserPostCommentRequest;
import com.crimecat.backend.webUser.domain.WebUser;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "user_post_comments")
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@AllArgsConstructor
public class UserPostComment {
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    // 게시글 연결
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_post_comments_post"))
    private UserPost post;

    // 작성자 연결
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_post_comments_author"))
    private WebUser author;

    // 부모 댓글 (대댓글인 경우)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", foreignKey = @ForeignKey(name = "fk_user_post_comments_parent"))
    private UserPostComment parent;

    // 자식 댓글 (답글들)
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserPostComment> children = new ArrayList<>();

    // 비밀 댓글 여부
    @Column(name = "is_private")
    @Builder.Default
    @JsonProperty("isPrivate")
    private boolean isPrivate = false;

    // 삭제 여부 (소프트 딜리트)
    @Column(name = "is_deleted")
    @Builder.Default
    private boolean isDeleted = false;

    // 생성 및 수정일
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 댓글 수정 메서드
    public void update(String content, boolean isPrivate) {
        this.content = content;
        this.isPrivate = isPrivate;
        this.updatedAt = LocalDateTime.now();
    }

    // 댓글 삭제 메서드 (소프트 딜리트)
    public void delete() {
        this.isDeleted = true;
        this.updatedAt = LocalDateTime.now();
    }

    // 팩토리 메서드
    public static UserPostComment from(UserPost post, WebUser author, UserPostCommentRequest request) {
        UserPostComment comment = UserPostComment.builder()
                .content(request.getContent())
                .post(post)
                .author(author)
                .isPrivate(request.isPrivate())
                .updatedAt(LocalDateTime.now())
                .build();
        
        if (request.getParentId() != null) {
            // 부모 댓글 ID만 설정 (실제 객체는 repository에서 로드 후 설정)
            comment.setParent(null);
        }
        
        return comment;
    }

    // 부모 댓글 설정 메서드
    public void setParent(UserPostComment parent) {
        this.parent = parent;
        if (parent != null) {
            parent.getChildren().add(this);
        }
    }
}
