package com.crimecat.backend.follow.domain;

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
@Table(name = "follows", uniqueConstraints = {
        @UniqueConstraint(name = "uk_follows_follower_following", columnNames = {"follower_id", "following_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Follow {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    // 팔로워 (팔로우하는 사용자)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false, foreignKey = @ForeignKey(name = "fk_follows_follower"))
    private WebUser follower;

    // 팔로잉 (팔로우 당하는 사용자)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id", nullable = false, foreignKey = @ForeignKey(name = "fk_follows_following"))
    private WebUser following;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // 팩토리 메서드
    public static Follow of(WebUser follower, WebUser following) {
        return Follow.builder()
                .follower(follower)
                .following(following)
                .build();
    }
}
