package com.crimecat.backend.coupon.repository;

import com.crimecat.backend.coupon.domain.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, UUID> {
    @Query("SELECT c FROM Coupon c WHERE c.id = :redeemUuid")
    Optional<Coupon> findById(@Param("redeemUuid") UUID id);


}
