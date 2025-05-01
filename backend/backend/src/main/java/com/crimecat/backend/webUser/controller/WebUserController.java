package com.crimecat.backend.webUser.controller;

import com.crimecat.backend.coupon.dto.CouponRedeemRequestDto;
import com.crimecat.backend.coupon.dto.MessageDto;
import com.crimecat.backend.coupon.dto.WebCouponRequestDto;
import com.crimecat.backend.coupon.service.CouponService;
import com.crimecat.backend.user.dto.UserGrantedPermissionDto;
import com.crimecat.backend.user.service.UserService;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.dto.WebUserProfileEditRequestDto;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import com.crimecat.backend.webUser.service.WebUserService;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/web_user")
public class WebUserController {

  private final WebUserService webUserService;
  private final CouponService couponService;
  private final WebUserRepository webUserRepository;
  private final UserService userService;

  @PostMapping("/daily_check/{user_id}")
  public ResponseEntity<Map<String, Object>> dailyCheck(@PathVariable("user_id") String userId) {
    return webUserService.userDailyCheck(userId);
  }
  @GetMapping("/daily_check/{user_id}")
  public ResponseEntity<Map<String, Object>> isDailyCheck(@PathVariable("user_id") String userId){
    return webUserService.isDailyCheck(userId);
  }
  @PatchMapping("/coupon")
  public MessageDto<?> couponReem (@RequestBody WebCouponRequestDto request){
    WebUser webUser = webUserRepository.findById(UUID.fromString(request.getUserId())).orElseThrow(ErrorStatus.USER_NOT_FOUND::asControllerException);
    CouponRedeemRequestDto couponRedeemRequestDto = new CouponRedeemRequestDto(
        webUser.getDiscordUserSnowflake(), request.getCode());
    return couponService.redeemCoupon(couponRedeemRequestDto);
  }
  /**
   * 유저가 가진 모든 권한 조회
   * @param userId
   * @return
   */
  @GetMapping("/{user_id}/permissions")
  public ResponseEntity<List<UserGrantedPermissionDto>> getAllUserPermissions(
          @PathVariable("user_id") String userId) {
    WebUser webUser = webUserRepository.findById(UUID.fromString(userId)).orElseThrow(ErrorStatus.USER_NOT_FOUND::asControllerException);
    return userService.getAllUserPermissionsForWeb(webUser.getDiscordUserSnowflake());
  }

  @PatchMapping("profile")
  public ResponseEntity<Void> editUserProfile(@RequestPart(name = "profileImage", required = false)
  MultipartFile file, @RequestPart(name = "data") WebUserProfileEditRequestDto webUserProfileEditRequestDto){

    //유저인증
    AuthenticationUtil.validateAdminOrSameUser(UUID.fromString(webUserProfileEditRequestDto.getUserId()));
    webUserService.userProfileSet(file,webUserProfileEditRequestDto);
    return ResponseEntity.status(HttpStatus.ACCEPTED).build();
  }

}
