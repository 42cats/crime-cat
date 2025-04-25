package com.crimecat.backend.web.gameHistory.domain;

import com.crimecat.backend.bot.guild.domain.Guild;
import com.crimecat.backend.bot.user.domain.DiscordUser;
import com.crimecat.backend.web.gametheme.domain.GameTheme;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "GAME_HISTORIES")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class GameHistory {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)", updatable = false)
    private UUID id;

    @Column(name = "IS_WIN")
    private boolean isWin = false;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "CHARACTER_NAME")
    private String characterName;

    @JoinColumn(name = "USER_SNOWFLAKE", referencedColumnName = "SNOWFLAKE", nullable = false, updatable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private DiscordUser user;

    @JoinColumn(name = "GAME_THEME_ID", referencedColumnName = "ID", nullable = true)
    @ManyToOne(fetch = FetchType.LAZY)
    private GameTheme gameTheme;

    @JoinColumn(name = "GUILD_SNOWFLAKE", referencedColumnName = "SNOWFLAKE", nullable = false, updatable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Guild guild;
    
    @Column(name = "MEMO", length = 1000)
    private String memo;

    public GameHistory(boolean isWin, LocalDateTime createdAt, String characterName, DiscordUser user, Guild guild, GameTheme gameTheme) {
        this.isWin = isWin;
        this.createdAt = createdAt;
        this.characterName = characterName;
        this.user = user;
        this.guild = guild;
        if(gameTheme != null)
            this.gameTheme = gameTheme;
    }

    public void setIsWin(Boolean isWin) {
        if (isWin == null) {
            return;
        }
        this.isWin = isWin;
    }

    public void setCharacterName(String characterName) {
        if (characterName == null) {
            return;
        }
        this.characterName = characterName;
    }
}
