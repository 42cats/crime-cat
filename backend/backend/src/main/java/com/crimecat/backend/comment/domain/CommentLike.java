package com.crimecat.backend.comment.domain;

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
@Table(name = "COMMENT_LIKES",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_comment_likes_user_comment", columnNames = {"USER_ID", "COMMENT_ID"})
        })
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@AllArgsConstructor
public class CommentLike {
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "USER_ID")
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID", updatable = false, insertable = false)
    private WebUser user;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "COMMENT_ID")
    private UUID commentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "COMMENT_ID", updatable = false, insertable = false)
    private Comment comment;

    @CreatedDate
    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;
}
