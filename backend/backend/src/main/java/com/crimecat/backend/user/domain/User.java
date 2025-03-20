package com.crimecat.backend.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "USERS")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Getter
public class User {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "SNOWFLAKE", nullable = false)
    private String snowflake;

    @Column(name = "NAME", nullable = false)
    private String name;

    @Column(name = "AVATAR", nullable = false)
    private String avatar;

    @Column(name = "DISCORD_ALARM")
    private boolean discordAlarm = false;

    @Column(name = "POINT")
    private Integer point = 0;

    @CreatedDate
    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "IS_WITHDRAW")
    private boolean isWithdraw = false;


    private User(String snowflake, String name, String avatar) {
        this.snowflake = snowflake;
        this.name = name;
        this.avatar = avatar;
    }

    public static User of(String snowflake, String name, String avatar) {
        return new User(snowflake, name, avatar);
    }
}
