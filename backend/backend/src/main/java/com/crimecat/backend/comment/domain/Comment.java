package com.crimecat.backend.comment.domain;

import com.crimecat.backend.comment.dto.CommentRequest;
import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.webUser.domain.WebUser;
import com.fasterxml.jackson.annotation.JsonProperty;
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
@Table(name = "COMMENTS")
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@AllArgsConstructor
public class Comment {
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "CONTENT", columnDefinition = "TEXT")
    private String content;

    // 게임 테마 연결
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "GAME_THEME_ID")
    private UUID gameThemeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GAME_THEME_ID", updatable = false, insertable = false)
    private GameTheme gameTheme;

    // 작성자 연결
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "AUTHOR_ID", insertable = false, updatable = false)
    private UUID authorId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AUTHOR_ID")
    private WebUser author;
    
    // authorId를 설정하는 메서드
    public void setAuthorId(UUID authorId) {
        this.authorId = authorId;
    }
    
    // author를 설정하는 메서드
    public void setAuthor(WebUser author) {
        this.author = author;
        if (author != null) {
            this.authorId = author.getId();
        }
    }

    // 부모 댓글 (대댓글인 경우)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "PARENT_ID")
    private UUID parentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PARENT_ID", updatable = false, insertable = false)
    private Comment parent;

    // 스포일러 여부
    @Column(name = "IS_SPOILER")
    @Builder.Default
    @JsonProperty("isSpoiler")
    private boolean isSpoiler = false;

    // 추천 수
    @Column(name = "LIKES")
    @Builder.Default
    private int likes = 0;

    // 삭제 여부 (소프트 딜리트)
    @Column(name = "IS_DELETED")
    @Builder.Default
    private boolean isDeleted = false;

    // 생성 및 수정일
    @CreatedDate
    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    // 댓글 수정 메서드
    public void update(String content, boolean isSpoiler) {
        this.content = content;
        this.isSpoiler = isSpoiler;
        this.updatedAt = LocalDateTime.now();
    }

    // 댓글 삭제 메서드 (소프트 딜리트)
    public void delete() {
        this.isDeleted = true;
        this.updatedAt = LocalDateTime.now();
    }

    // 좋아요 증가 메서드
    public void incrementLikes() {
        this.likes++;
    }

    // 좋아요 감소 메서드
    public void decrementLikes() {
        if (this.likes > 0) {
            this.likes--;
        }
    }

    public static Comment from(UUID gameThemeId, UUID userId, CommentRequest request, WebUser author){
        Comment comment = Comment.builder()
            .content(request.getContent())
            .gameThemeId(gameThemeId)
            .parentId(request.getParentId())
            .isSpoiler(request.isSpoiler()) // 명시적으로 isSpoiler 값 설정
            .updatedAt(LocalDateTime.now())
            .build();
        
        // 작성자 객체 설정
        comment.setAuthor(author);
        
        return comment;
    }
}
