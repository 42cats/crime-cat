package com.crimecat.backend.bot.user.domain;

import com.crimecat.backend.web.webUser.domain.WebUser;
import jakarta.persistence.*;
import java.util.Objects;
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

    public String getName() {
        if (webUser != null) {
            return webUser.getNickname();
        }
        if (discordUser != null) {
            return maskName(discordUser.getName()); // 이제 안전
        }
        return "UNKNOWN";
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof User user))
            return false;
      return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    public static String maskName(String name) {
        if (name == null || name.isBlank()) return "";

        int length = name.length();

        if (length == 1) {
            return "*";
        } else if (length == 2) {
            return name.charAt(0) + "*";
        } else if (length == 3) {
            return name.charAt(0) + "*" + name.charAt(2);
        } else if (length == 4) {
            return name.charAt(0) + "**" + name.charAt(3);
        } else {
            // 5글자 이상은 가운데 2글자 마스킹
            int maskStart = length / 2 - 1;
            int maskEnd = maskStart + 2;

            StringBuilder sb = new StringBuilder(name);
            for (int i = maskStart; i < maskEnd && i < length; i++) {
                sb.setCharAt(i, '*');
            }
            return sb.toString();
        }
    }

}
