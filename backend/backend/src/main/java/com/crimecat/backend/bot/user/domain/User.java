package com.crimecat.backend.bot.user.domain;

import com.crimecat.backend.web.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "USERS")
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@AllArgsConstructor
public class User {
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "DISCORD_SNOWFLAKE", unique = true)
    private String discordSnowflake;

    @Setter
    @Column(name = "POINT")
    @Builder.Default
    private Integer point = 0;

    @Setter
    @Column(name = "IS_WITHDRAW",nullable = false)
    @Builder.Default
    private Boolean isWithdraw = false;

    @Setter
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "WEB_USER_ID", referencedColumnName = "ID")
    private WebUser webUser;

    @Setter
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DISCORD_USER_ID", referencedColumnName = "ID")
    private DiscordUser discordUser;

    @CreatedDate
    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    public void addPoint(int amount) {
        if (amount < 0) throw new IllegalArgumentException("음수는 더할 수 없습니다.");
        this.point += amount;
    }

    public void subtractPoint(int amount) {
        if (amount < 0) throw new IllegalArgumentException("음수를 뺄 수 없습니다.");
        if (this.point < amount) throw new IllegalStateException("잔여 포인트 부족");
        this.point -= amount;
    }
    public void linkDiscordUser(DiscordUser discordUser) {
        this.discordUser = discordUser;
        if (discordUser.getUser() != this) {
            discordUser.setUser(this);
        }
    }

    public void linkWebUser(WebUser webUser) {
        this.webUser = webUser;
        if (webUser.getUser() != this) {
            webUser.setUser(this);
        }
    }

}
