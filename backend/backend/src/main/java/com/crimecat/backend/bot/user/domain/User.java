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
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@AllArgsConstructor
public class User {
    @Id
    @UuidGenerator
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @JoinColumn(name = "WEB_USER_ID", referencedColumnName = "ID")
    @ManyToOne(fetch = FetchType.LAZY)
    private WebUser webUser;

    @JoinColumn(name = "DISCORD_USER_ID", referencedColumnName = "ID")
    @ManyToOne(fetch = FetchType.LAZY)
    private DiscordUser discordUser;

    @CreatedDate
    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;
}
