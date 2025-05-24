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

/**
 * 방탈출 댓글 좋아요 엔티티
 */
@Entity
@Table(name = "ESCAPE_ROOM_COMMENT_LIKES",
       uniqueConstraints = {
           @UniqueConstraint(
               name = "uk_escape_room_comment_like",
               columnNames = {"COMMENT_ID", "WEB_USER_ID"}
           )
       },
       indexes = {
           @Index(name = "idx_escape_room_comment_like_comment", columnList = "comment_id"),
           @Index(name = "idx_escape_room_comment_like_user", columnList = "web_user_id")
       })
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Getter
@EntityListeners(AuditingEntityListener.class)
public class EscapeRoomCommentLike {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    /**
     * 좋아요한 댓글
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "COMMENT_ID", nullable = false)
    private EscapeRoomComment comment;

    /**
     * 좋아요한 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "WEB_USER_ID", nullable = false)
    private WebUser webUser;

    /**
     * 좋아요 생성 시간
     */
    @CreatedDate
    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt;
}