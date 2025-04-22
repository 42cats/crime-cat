package com.crimecat.backend.web.gameHistory.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import com.crimecat.backend.bot.guild.domain.Guild;
import com.crimecat.backend.bot.user.domain.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

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
    private User user;

    @JoinColumn(name = "GUILD_SNOWFLAKE", referencedColumnName = "SNOWFLAKE", nullable = false, updatable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Guild guild;

    public GameHistory(boolean isWin, LocalDateTime createdAt, String characterName, User user, Guild guild) {
        this.isWin = isWin;
        this.createdAt = createdAt;
        this.characterName = characterName;
        this.user = user;
        this.guild = guild;
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
