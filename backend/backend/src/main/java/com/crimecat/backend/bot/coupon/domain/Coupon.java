package com.crimecat.backend.bot.coupon.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import com.crimecat.backend.bot.user.domain.User;

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
@Table(name = "COUPONS")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Coupon {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
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


    public Coupon(Integer point, Integer duration) {
        this.point = point;
        this.createdAt = LocalDateTime.now();
        this.usedAt = null;
        this.expiredAt = this.createdAt.plusDays(duration);
        this.user = null;
    }

    public static Coupon create(Integer point, Integer duration){
        return new Coupon(point,duration);
    }
    public boolean isExpired(){
        return this.expiredAt.isBefore(LocalDateTime.now());
    }
    public boolean isUsed(){
        return (this.user != null);
    }
    public void use(User user) {
        if(isUsed()) throw new IllegalStateException("이미 사용된 쿠폰입니다.");
        if(isExpired()) throw new IllegalStateException("이미 만료된 쿠폰입니다");

        this.user = user;
        this.usedAt = LocalDateTime.now();
    }
}
