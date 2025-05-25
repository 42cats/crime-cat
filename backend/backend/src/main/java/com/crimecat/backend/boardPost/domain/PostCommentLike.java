package com.crimecat.backend.boardPost.domain;

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
@Table(name = "POST_COMMENT_LIKES")
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PostCommentLike {
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
    @Column(name = "COMMENT_ID")
    private UUID commentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "COMMENT_ID", referencedColumnName = "ID", updatable = false, insertable = false)
    private PostComment postComment;

    @CreatedDate
    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

}

