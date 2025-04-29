package com.crimecat.backend.web.gametheme.domain;

import com.crimecat.backend.bot.user.domain.User;
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
@Table(name = "GAME_THEME_RECOMMENDATIONS",
        uniqueConstraints = {
        @UniqueConstraint(name = "uk_gametheme_recommendations_user_theme", columnNames = {"USER_ID", "THEME_ID"})
})
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@AllArgsConstructor
public class GameThemeRecommendation {
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
    private User user;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "THEME_ID")
    private UUID themeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "THEME_ID", updatable = false, insertable = false)
    private GameTheme theme;

    @CreatedDate
    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;
}
