package com.crimecat.backend.schedule.domain;

import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 사용자의 비활성화 날짜를 비트맵으로 압축 저장하는 엔티티
 * 3개월(90일)을 12바이트 비트맵으로 압축하여 저장
 */
@Entity
@Table(name = "user_blocked_periods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBlockedPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private WebUser user;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "blocked_days_bitmap", nullable = false, columnDefinition = "BINARY(12)")
    private byte[] blockedDaysBitmap;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}