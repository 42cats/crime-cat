package com.crimecat.backend.point.domain;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
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
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "POINT_HISTORIES")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Getter
public class PointHistory {

    @Id
    @UuidGenerator
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "POINT", nullable = false)
    private Integer point;

    @Column(name = "USED_AT", nullable = false)
    @CreatedDate
    private LocalDateTime usedAt;

    @JoinColumn(name = "USER_SNOWFLAKE", referencedColumnName = "SNOWFLAKE", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @JoinColumn(name = "PERMISSION_ID")
    @ManyToOne(fetch = FetchType.LAZY)
    private Permission permission;


    public PointHistory(User user, Permission permission, Integer point) {
        this.user = user;
        this.permission = permission;
        this.point = point;
    }
}
