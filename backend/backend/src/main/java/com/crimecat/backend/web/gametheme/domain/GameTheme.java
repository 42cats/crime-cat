package com.crimecat.backend.web.gametheme.domain;

import com.crimecat.backend.bot.user.domain.User;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
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
import java.util.UUID;

@Entity
@Table(name = "GAME_THEMES")
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Getter
@SuperBuilder
@AllArgsConstructor
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "`TYPE`")
public class GameTheme {
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "TITLE")
    private String title;

    @Column(name = "THUMBNAIL", columnDefinition = "TEXT")
    private String thumbnail;

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
    @JoinColumn(name = "AUTHOR")
    private User author;

    @Type(JsonType.class)
    @Column(name = "`TAGS`", columnDefinition = "JSON")
    private List<String> tags;

    @Column(name = "CONTENT", columnDefinition = "TEXT")
    private String content;

    @Column(name = "PLAYER_MIN")
    private int playerMin;

    @Column(name = "PLAYER_MAX")
    private int playerMax;

    @Column(name = "PLAYTIME")
    private int playtime;

    @Column(name = "PRICE")
    private int price;

    @Column(name = "DIFFICULTY")
    private int difficulty;

    @Column(name = "IS_PUBLIC")
    @Builder.Default
    private boolean isPublic = true;

    @Column(name = "IS_DELETED")
    @Builder.Default
    private boolean isDeleted = false;

    @CreatedDate
    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;
}
