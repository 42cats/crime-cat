package com.crimecat.backend.gametheme.domain;

import com.crimecat.backend.user.domain.User;
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
@Table(name = "GAME_THEME_RECOMMENDATIONS",
        uniqueConstraints = {
        @UniqueConstraint(name = "uk_gametheme_recommendations_user_theme", columnNames = {"WEB_USER_ID", "THEME_ID"})
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
    @Column(name = "WEB_USER_ID")
    private UUID webUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "WEB_USER_ID", updatable = false, insertable = false)
    private WebUser webUser;

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
