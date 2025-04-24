package com.crimecat.backend.web.webUser.controller;

import com.crimecat.backend.bot.coupon.dto.CouponRedeemRequestDto;
import com.crimecat.backend.bot.coupon.dto.MessageDto;
import com.crimecat.backend.bot.coupon.dto.WebCouponRequestDto;
import com.crimecat.backend.bot.coupon.service.CouponService;
import com.crimecat.backend.bot.user.repository.UserRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.web.webUser.domain.WebUser;
import com.crimecat.backend.web.webUser.repository.WebUserRepository;
import com.crimecat.backend.web.webUser.service.WebUserService;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/web_user")
public class WebUserController {

  private final WebUserService webUserService;
  private final CouponService couponService;
  private final UserRepository userRepository;
  private final WebUserRepository webUserRepository;

  @PostMapping("/daily_check/{user_id}")
  public ResponseEntity<Map<String, Object>> dailyCheck(@PathVariable("user_id") String userId) {
    return webUserService.userDailyCheck(userId);
  }
  @GetMapping("/daily_check/{user_id}")
  public ResponseEntity<Map<String, Object>> isDailyCheck(@PathVariable("user_id") String userId){
    return webUserService.isDailyCheck(userId);
  }
  @PatchMapping("/coupons")
  public MessageDto<?> couponReem (@RequestBody WebCouponRequestDto request){
    WebUser webUser = webUserRepository.findById(UUID.fromString(request.getUserId())).orElseThrow(ErrorStatus.USER_NOT_FOUND::asControllerException);
    CouponRedeemRequestDto couponRedeemRequestDto = new CouponRedeemRequestDto(
        webUser.getDiscordUserSnowflake(), request.getCode());
    return couponService.redeemCoupon(couponRedeemRequestDto);
  }
}
