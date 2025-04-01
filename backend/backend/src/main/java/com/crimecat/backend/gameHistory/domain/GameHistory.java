package com.crimecat.backend.gameHistory.domain;

import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.user.domain.User;
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
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "GAME_HISTORIES")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class GameHistory {

    @Id
    @UuidGenerator
    @Column(name = "ID", columnDefinition = "BINARY(16)", updatable = false)
    private UUID id;

    @Column(name = "IS_WIN", updatable = false)
    private boolean isWin = false;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "CHARACTER_NAME", nullable = false, updatable = false)
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
}
