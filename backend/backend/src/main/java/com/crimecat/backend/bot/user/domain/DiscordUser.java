package com.crimecat.backend.bot.user.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "DISCORD_USERS")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Setter
public class DiscordUser {

    @Id
    @UuidGenerator
    @GeneratedValue
    @Getter
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Getter
    @Column(name = "SNOWFLAKE", nullable = false, unique = true)
    private String snowflake;

    @Column(name = "NAME", nullable = false)
    private String name;

    @Getter
    @Column(name = "AVATAR", nullable = false)
    private String avatar;

    @Getter
    @Column(name = "DISCORD_ALARM")
    private boolean discordAlarm = false;

//    @Column(name = "POINT")
//    private Integer point = 0;

    @Getter
    @OneToOne(mappedBy = "discordUser", fetch = FetchType.LAZY)
    private User user;

    @CreatedDate
    @Getter
    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "IS_WITHDRAW")
    @Getter
    private boolean isWithdraw = false;


    private DiscordUser(String snowflake, String name, String avatar) {
        this.snowflake = snowflake;
        this.name = name;
        this.avatar = avatar;
    }

    public static DiscordUser of(String snowflake, String name, String avatar) {
        return new DiscordUser(snowflake, name, avatar);
    }

    public Integer getPoint() {
        return user.getPoint();
    }

    public void subtractPoint(int amount) {
          this.user.subtractPoint(amount);
    }


    public void addPoint(Integer point){
        this.user.addPoint(point);
    }

    public void setAvatar(String avatar) {
        if (avatar == null) {
            return;
        }
        this.avatar = avatar;
    }

    public void setDiscordAlarm(Boolean discordAlarm) {
        this.discordAlarm = discordAlarm;
    }

    public String getName(){
        return user.getName();
    }
}
