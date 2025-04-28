package com.crimecat.backend.web.gametheme.domain;

import com.crimecat.backend.bot.user.domain.User;
import com.crimecat.backend.web.gametheme.dto.AddCrimesceneThemeRequest;
import com.crimecat.backend.web.gametheme.dto.AddGameThemeRequest;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "GAME_THEMES")
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Getter
@SuperBuilder
@AllArgsConstructor
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "`TYPE`", discriminatorType = DiscriminatorType.INTEGER)
public class GameTheme {
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Setter
    @Column(name = "TITLE")
    private String title;

    @Setter
    @Column(name = "THUMBNAIL", columnDefinition = "TEXT")
    private String thumbnail;

    @Setter
    @Column(name = "SUMMARY", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "RECOMMENDATIONS")
    @Builder.Default
    private int recommendations = 0;

    @Column(name = "VIEWS")
    @Builder.Default
    private int views = 0;

    @Column(name = "PLAY_COUNT")
    @Builder.Default
    private int playCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AUTHOR", updatable = false, insertable = false)
    private User author;

    @Setter
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "AUTHOR")
    private UUID authorId;

    @Setter
    @Type(JsonType.class)
    @Column(name = "`TAGS`", columnDefinition = "LONGTEXT")
    private Set<String> tags;

    @Setter
    @Column(name = "CONTENT", columnDefinition = "TEXT")
    private String content;

    @Setter
    @Column(name = "PLAYER_MIN")
    private int playerMin;

    @Setter
    @Column(name = "PLAYER_MAX")
    private int playerMax;

    @Setter
    @Column(name = "PLAYTIME")
    private int playtime;

    @Setter
    @Column(name = "PRICE")
    private int price;

    @Setter
    @Column(name = "DIFFICULTY")
    private int difficulty;

    @Setter
    @Column(name = "IS_PUBLIC")
    @Builder.Default
    private boolean publicStatus = true;

    @Column(name = "IS_DELETED")
    @Builder.Default
    private boolean isDeleted = false;

    @CreatedDate
    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    public static GameTheme from(AddGameThemeRequest request) {
        if (request instanceof AddCrimesceneThemeRequest) {
            return CrimesceneTheme.from((AddCrimesceneThemeRequest) request);
        }
        return GameTheme.builder()
                .title(request.getTitle())
                .summary(request.getSummary())
                .tags(request.getTags())
                .content(request.getContent())
                .playerMin(request.getPlayerMin())
                .playerMax(request.getPlayerMax())
                .playtime(request.getPlaytime())
                .price(request.getPrice())
                .difficulty(request.getDifficulty())
                .publicStatus(request.isPublicStatus())
                .build();
    }

    public void setIsDelete(Boolean isDeleted) {
        if (isDeleted == null) {
            return;
        }
        this.isDeleted = isDeleted;
    }

    public void viewed() {
        this.views++;
    }
}
