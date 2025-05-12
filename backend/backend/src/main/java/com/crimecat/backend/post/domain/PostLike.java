package com.crimecat.backend.post.domain;

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
@Table(name = "POST_LIKES")
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PostLike {
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "USER")
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER", referencedColumnName = "ID", updatable = false, insertable = false)
    private WebUser user;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "POST")
    private UUID postId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "POST", referencedColumnName = "ID", updatable = false, insertable = false)
    private Post post;

    @CreatedDate
    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;
}
