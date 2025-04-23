package com.crimecat.backend.bot.point.domain;

import com.crimecat.backend.bot.permission.domain.Permission;
import com.crimecat.backend.bot.user.domain.User;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "POINT_HISTORIES")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@AllArgsConstructor
public class PointHistory {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @JoinColumn(name = "USER_ID", referencedColumnName = "ID", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @Column(name = "TYPE", nullable = false)
    private TransactionType type;

    @Column(name = "AMOUNT", nullable = false)
    private Integer amount;

    @Column(name = "BALANCE_AFTER", nullable = false)
    private Integer balanceAfter;

    @Column(name = "ITEM_TYPE")
    private ItemType itemType;

    @Column(name = "ITEM_ID", columnDefinition = "BINARY(16)")
    private UUID itemId;
    
    @JoinColumn(name = "RELATED_USER_ID", referencedColumnName = "ID", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private User relatedUserId;

    @Column(name = "MEMO")
    private String memo;

    @Column(name = "CREATED_AT", nullable = false)
    @CreatedDate
    private LocalDateTime usedAt;

    @JoinColumn(name = "PERMISSION_ID")
    @ManyToOne(fetch = FetchType.LAZY)
    private Permission permission;

}
