package com.crimecat.backend.bot.user.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import com.crimecat.backend.bot.permission.domain.Permission;

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
@Table(name = "USER_PERMISSIONS")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class UserPermission {
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "EXPIRED_AT")
    private LocalDateTime expiredAt;

    @JoinColumn(name = "USER_SNOWFLAKE", referencedColumnName = "SNOWFLAKE", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private DiscordUser user;

    @JoinColumn(name = "PERMISSION_ID")
    @ManyToOne(fetch = FetchType.LAZY)
    private Permission permission;

    public void extendPermissionPeriod(Integer duration) {
        expiredAt = expiredAt.plusDays(duration);
    }

    public UserPermission(DiscordUser user, Permission permission) {
        this.user = user;
        this.permission = permission;
        this.expiredAt = LocalDateTime.now().plusDays(permission.getDuration());
    }
}
