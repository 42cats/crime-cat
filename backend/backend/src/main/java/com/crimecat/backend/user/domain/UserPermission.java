package com.crimecat.backend.user.domain;

import com.crimecat.backend.permission.domain.Permission;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

@Entity
@Table(name = "USER_PERMISSION")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class UserPermission {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @JoinColumn(name = "USER_SNOWFLAKE")
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @JoinColumn(name = "PERMISSION_ID")
    @ManyToOne(fetch = FetchType.LAZY)
    private Permission permission;

    @Column(name = "EXPIRED_AT")
    private LocalDateTime expiredAt;
}
