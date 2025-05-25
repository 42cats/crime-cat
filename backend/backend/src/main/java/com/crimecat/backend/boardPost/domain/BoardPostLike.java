package com.crimecat.backend.boardPost.domain;

import com.crimecat.backend.boardPost.dto.BoardPostRequest;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "BOARD_POST_LIKES")
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BoardPostLike {
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "USER_ID")
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID", referencedColumnName = "ID", updatable = false, insertable = false)
    private WebUser user;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "POST_ID")
    private UUID postId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "POST_ID", referencedColumnName = "ID", updatable = false, insertable = false)
    private BoardPost boardPost;

    @CreatedDate
    @Builder.Default
    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt = LocalDateTime.now();

    public static BoardPostLike from(BoardPost boardPost, WebUser user){
        return BoardPostLike.builder()
                .boardPost(boardPost)
                .postId(boardPost.getId())
                .user(user)
                .userId(user.getId())
                .build();
    }
}
