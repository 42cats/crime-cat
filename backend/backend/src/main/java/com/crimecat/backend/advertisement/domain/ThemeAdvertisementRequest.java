package com.crimecat.backend.advertisement.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "theme_advertisement_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThemeAdvertisementRequest {
    
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;
    
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "user_id", columnDefinition = "BINARY(16)", nullable = false)
    private UUID userId;
    
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "theme_id", columnDefinition = "BINARY(16)", nullable = false)
    private UUID themeId;
    
    @Column(name = "theme_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private ThemeType themeType;
    
    @Column(name = "theme_name", nullable = false)
    private String themeName;
    
    @Column(name = "requested_days", nullable = false)
    private Integer requestedDays;
    
    @Column(name = "remaining_days")
    private Integer remainingDays;
    
    @Column(name = "total_cost", nullable = false)
    private Integer totalCost;
    
    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;
    
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private AdvertisementStatus status;
    
    @Column(name = "queue_position")
    private Integer queuePosition;
    
    @Column(name = "click_count")
    @Builder.Default
    private Integer clickCount = 0;
    
    @Column(name = "exposure_count")
    @Builder.Default
    private Integer exposureCount = 0;
    
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
    
    @Column(name = "refund_amount")
    private Integer refundAmount;
    
    @PrePersist
    public void prePersist() {
        if (this.requestedAt == null) {
            this.requestedAt = LocalDateTime.now();
        }
        if (this.clickCount == null) {
            this.clickCount = 0;
        }
        if (this.exposureCount == null) {
            this.exposureCount = 0;
        }
    }
    
    public enum ThemeType {
        CRIMESCENE,
        ESCAPE_ROOM,
        MURDER_MYSTERY,
        REALWORLD
    }
}