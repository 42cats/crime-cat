package com.crimecat.backend.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "USERS")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class User {

    @Id
    @UuidGenerator
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "SNOWFLAKE", nullable = false)
    private String snowflake;

    @Column(name = "NAME", nullable = false)
    private String name;

    @Column(name = "AVATAR", nullable = false)
    private String avatar;

    @Column(name = "DISCORD_ALARM", nullable = false)
    private boolean discordAlarm;

    @Column(name = "POINT", nullable = false)
    private Integer point;

    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "IS_WITHDRAW", nullable = false)
    private boolean isWithdraw;

}
