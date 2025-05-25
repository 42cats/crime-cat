package com.crimecat.backend.boardPost.domain;

import com.crimecat.backend.boardPost.dto.BoardPostRequest;
import com.crimecat.backend.boardPost.enums.BoardType;
import com.crimecat.backend.boardPost.enums.PostType;
import com.crimecat.backend.webUser.domain.WebUser;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "BOARD_POSTS")
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BoardPost {
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "NUMBER", insertable = false, updatable = false)
    private Integer number;

    @Column(name = "SUBJECT", length = 200)
    private String subject;

    @Column(name = "CONTENT", columnDefinition = "TEXT")
    private String content;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "AUTHOR_ID")
    private UUID authorId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AUTHOR_ID", updatable = false, insertable = false)
    private WebUser author;

    @Builder.Default
    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @Builder.Default
    @Column(name = "IS_DELETED")
    private Boolean isDeleted = false;

    @Builder.Default
    @Column(name = "VIEWS")
    private Integer views = 0;

    @Builder.Default
    @Column(name = "LIKES")
    private Integer likes = 0;

    @Builder.Default
    @Column(name = "COMMENTS")
    private Integer comments = 0;

    @Builder.Default
    @Column(name = "IS_SECRET")
    @JsonProperty("isSecret")
    private Boolean isSecret = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "POST_TYPE")
    private PostType postType;

    @Enumerated(EnumType.STRING)
    @Column(name = "BOARD_TYPE")
    private BoardType boardType;

    @Builder.Default
    @Column(name = "IS_PINNED")
    @JsonProperty("isPinned")
    private Boolean isPinned = false;

    // author를 설정하는 메서드
    public void setUser(WebUser author) {
        this.author = author;
        if (author != null) {
            this.authorId = author.getId();
        }
    }

    public void update(BoardPostRequest boardPostRequest) {
        this.updatedAt = LocalDateTime.now();
        this.subject = boardPostRequest.getSubject();
        this.content = boardPostRequest.getContent();
        this.isSecret = boardPostRequest.getIsSecret();
        this.isPinned = boardPostRequest.getIsPinned();
        this.postType = boardPostRequest.getPostType();
        this.boardType = boardPostRequest.getBoardType();
    }

    public void delete() {
        this.updatedAt = LocalDateTime.now();
        this.isDeleted = true;
    }

    public static BoardPost from(BoardPostRequest request, WebUser author){
        BoardPost boardPost = BoardPost.builder()
                .subject(request.getSubject())
                .content(request.getContent())
                .isSecret(request.getIsSecret())
                .postType(request.getPostType())
                .boardType(request.getBoardType())
                .isPinned(request.getIsPinned())
                .build();

        boardPost.setUser(author);

        return boardPost;
    }

    public void viewed() {
        this.views++;
    }
    public void like() {
        this.likes++;
    }
    public void dislike() {
        if(this.likes > 0){
            this.likes--;
        }
    }

}
