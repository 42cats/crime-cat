package com.crimecat.backend.boardPost.domain;

import com.crimecat.backend.boardPost.enums.BoardType;
import com.crimecat.backend.boardPost.enums.PostType;
import com.crimecat.backend.webUser.domain.WebUser;
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

    @Column(name = "NUMBER")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer number;

    @Column(name = "SUBJECT", length = 200)
    private String subject;

    @Column(name = "CONTENT", columnDefinition = "TEXT")
    private String content;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "USER")
    private UUID userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "USER", updatable = false, insertable = false)
    private WebUser user;

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
    private Boolean isSecret = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "POST_TYPE")
    private PostType postType;

    @Enumerated(EnumType.STRING)
    @Column(name = "BOARD_TYPE")
    private BoardType boardtype;

    @Builder.Default
    @Column(name = "IS_PINNED")
    private Boolean isPinned = false;
}
