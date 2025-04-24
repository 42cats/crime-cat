package com.crimecat.backend.bot.coupon.service;

import com.crimecat.backend.bot.coupon.domain.Coupon;
import com.crimecat.backend.bot.coupon.dto.CouponCreateRequestDto;
import com.crimecat.backend.bot.coupon.dto.CouponListResponse;
import com.crimecat.backend.bot.coupon.dto.CouponRedeemRequestDto;
import com.crimecat.backend.bot.coupon.dto.CouponRedeemResponseDto;
import com.crimecat.backend.bot.coupon.dto.CouponResponseDto;
import com.crimecat.backend.bot.coupon.dto.MessageDto;
import com.crimecat.backend.bot.coupon.repository.CouponRepository;
import com.crimecat.backend.bot.point.service.PointHistoryService;
import com.crimecat.backend.bot.user.domain.User;
import com.crimecat.backend.bot.user.repository.UserRepository;
import com.crimecat.backend.exception.ErrorStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CouponService {
    private final CouponRepository couponRepository;
    private final PointHistoryService pointHistoryService;
    private final UserRepository userRepository;
    public MessageDto<CouponListResponse> createCoupon(CouponCreateRequestDto requestDto){
        List<Coupon> coupons = IntStream.range(0, requestDto.getCount())
                .mapToObj(i -> Coupon.create(requestDto.getValue(), requestDto.getDuration()))
                .toList();

        // 저장
        couponRepository.saveAll(coupons);

        // DTO 변환
        List<CouponResponseDto> responseDtos = coupons.stream()
                .map(c -> new CouponResponseDto(
                        c.getId().toString(),
                        c.getPoint(),
                        c.getExpiredAt() // 그대로 주거나 계산 가능
                ))
                .toList();
        return new MessageDto<>("created successfully", new CouponListResponse(responseDtos));
    }
    public MessageDto<?> redeemCoupon(CouponRedeemRequestDto request){
    if (request.getUserSnowflake() == null || request.getUserSnowflake().isEmpty()) {
      throw ErrorStatus.USER_NOT_FOUND.asServiceException();
    }
    if (request.getCode() == null || request.getCode().isEmpty()) {
      throw ErrorStatus.INVALID_INPUT.asServiceException();
    }
        Optional<Coupon> optionalCoupon = couponRepository.findByIdForUpdate(UUID.fromString(request.getCode()));
        User user = userRepository.findByDiscordSnowflake(request.getUserSnowflake())
            .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
    if (optionalCoupon.isEmpty()) {
      throw ErrorStatus.INVALID_INPUT.asServiceException();
    }
        Coupon coupon  = optionalCoupon.get();
        coupon.use(user);
        user.addPoint(coupon.getPoint());
        pointHistoryService.usePoint(user,null,coupon.getPoint());
        return new MessageDto<>("Coupon redeemed successfully", new CouponRedeemResponseDto(user.getPoint()));
    }
}
