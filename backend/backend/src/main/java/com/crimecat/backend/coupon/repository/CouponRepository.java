package com.crimecat.backend.coupon.repository;

import com.crimecat.backend.coupon.domain.Coupon;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Coupon c WHERE c.id = :id")
    Optional<Coupon> findByIdForUpdate(@Param("id") UUID id);

    // 관리자용 쿼리 메서드들

    /**
     * 사용된 쿠폰 조회 (페이징)
     */
    Page<Coupon> findByUserIsNotNull(Pageable pageable);

    /**
     * 만료된 미사용 쿠폰 조회 (페이징)
     */
    Page<Coupon> findByUserIsNullAndExpiredAtBefore(LocalDateTime dateTime, Pageable pageable);

    /**
     * 미사용 유효 쿠폰 조회 (페이징)
     */
    Page<Coupon> findByUserIsNullAndExpiredAtAfter(LocalDateTime dateTime, Pageable pageable);

    /**
     * 사용된 쿠폰 수
     */
    long countByUserIsNotNull();

    /**
     * 만료된 미사용 쿠폰 수
     */
    long countByUserIsNullAndExpiredAtBefore(LocalDateTime dateTime);

    /**
     * 전체 발급 포인트 합계
     */
    @Query("SELECT SUM(c.point) FROM Coupon c")
    Long sumAllPoints();

    /**
     * 사용된 포인트 합계
     */
    @Query("SELECT SUM(c.point) FROM Coupon c WHERE c.user IS NOT NULL")
    Long sumUsedPoints();

}
