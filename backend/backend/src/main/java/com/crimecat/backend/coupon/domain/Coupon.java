package com.crimecat.backend.coupon.domain;

import com.crimecat.backend.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "COUPONS")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Coupon {

    @Id
    @UuidGenerator
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "POINT", nullable = false)
    private Integer point;

    /**
     * 쿠폰이 생성된 시각
     */
    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;

    /**
     * 쿠폰이 등록된 시각
     */
    @Column(name = "USED_AT")
    private LocalDateTime usedAt;

    /**
     * 쿠폰 등록 마감 기한
     */
    @Column(name = "EXPIRED_AT", nullable = false)
    private LocalDateTime expiredAt;

    /**
     * 쿠폰을 등록/사용한 사용자
     */
    @JoinColumn(name = "USER_SNOWFLAKE", referencedColumnName = "SNOWFLAKE")
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

}
