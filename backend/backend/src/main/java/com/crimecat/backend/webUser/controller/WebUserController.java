package com.crimecat.backend.webUser.controller;

import com.crimecat.backend.coupon.dto.CouponRedeemRequestDto;
import com.crimecat.backend.coupon.dto.MessageDto;
import com.crimecat.backend.coupon.dto.WebCouponRequestDto;
import com.crimecat.backend.coupon.service.CouponService;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.user.dto.UserGrantedPermissionDto;
import com.crimecat.backend.user.service.UserService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.dto.FindUserInfo;
import com.crimecat.backend.webUser.dto.NicknameCheckResponseDto;
import com.crimecat.backend.webUser.dto.NotificationSettingsRequestDto;
import com.crimecat.backend.webUser.dto.NotificationSettingsResponseDto;
import com.crimecat.backend.webUser.dto.NotificationToggleRequest;
import com.crimecat.backend.webUser.dto.UserProfileInfoResponseDto;
import com.crimecat.backend.webUser.dto.WebUserProfileEditRequestDto;
import com.crimecat.backend.webUser.enums.UserRole;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import com.crimecat.backend.webUser.service.WebUserService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

  @PutMapping(
      path = "{user_id}/profile",
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE
  )
  public ResponseEntity<Void> editUserProfile(
      @RequestPart(name = "avatar", required = false) MultipartFile file,
      @RequestPart(name = "data") WebUserProfileEditRequestDto webUserProfileEditRequestDto,
      @PathVariable("user_id") String userId
  ){
    //유저인증
    AuthenticationUtil.validateCurrentUserMatches(UUID.fromString(userId));
    webUserProfileEditRequestDto.setUserId(userId);
    webUserService.userProfileSet(file,webUserProfileEditRequestDto);
    return ResponseEntity.status(HttpStatus.ACCEPTED).build();
  }

  /**
   * 닉네임 중복 체크 API
   *
   * @param nickname 중복 체크할 닉네임
   * @return 사용 가능 여부 및 메시지
   */
  @GetMapping("/check-nickname")
  public ResponseEntity<NicknameCheckResponseDto> checkNickname(@RequestParam String nickname) {
    NicknameCheckResponseDto response = webUserService.checkNicknameDuplicate(nickname);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/profile/{user_id}")
  public ResponseEntity<UserProfileInfoResponseDto> getUserInfo(@PathVariable("user_id") String userId){
    AuthenticationUtil.validateCurrentUserMatches(UUID.fromString(userId));
    UserProfileInfoResponseDto userInfo = webUserService.getUserInfo(userId);
    return ResponseEntity.ok().body(userInfo);
  }

  @GetMapping("/{user_id}/notifications/settings")
  public ResponseEntity<NotificationSettingsResponseDto> getNotificationSettings(@PathVariable("user_id") String userId){
    AuthenticationUtil.validateCurrentUserMatches(UUID.fromString(userId));
    NotificationSettingsResponseDto userNotificationSettings = webUserService.getUserNotificationSettings(
        userId);
    return ResponseEntity.ok().body(userNotificationSettings);
  }

  @PutMapping("{user_id}/notifications/discord")
  public ResponseEntity<NotificationSettingsResponseDto> setDiscordAlarm(
      @PathVariable("user_id") String userId,
      @RequestBody NotificationToggleRequest body
  ){
    AuthenticationUtil.validateCurrentUserMatches(UUID.fromString(userId));
    NotificationSettingsResponseDto notificationSettingsResponseDto = webUserService.setDiscordAlarm(
        userId, body);
    return ResponseEntity.ok().body(notificationSettingsResponseDto);
  }
  @PutMapping("{user_id}/notifications/email")
  public ResponseEntity<NotificationSettingsResponseDto> setEmailAlarm(
      @PathVariable("user_id") String userId,
      @RequestBody NotificationToggleRequest body
      ){
    AuthenticationUtil.validateCurrentUserMatches(UUID.fromString(userId));
    NotificationSettingsResponseDto notificationSettingsResponseDto = webUserService.setEmailAlarm(
        userId, body);
    return ResponseEntity.ok().body(notificationSettingsResponseDto);
  }

  @PutMapping("/{user_id}/notifications/settings")
  public ResponseEntity<NotificationSettingsResponseDto> setAllNotificationSetting(
      @PathVariable("user_id") String userId,
      @RequestBody NotificationSettingsRequestDto body
      ){
    AuthenticationUtil.validateCurrentUserMatches(UUID.fromString(userId));
    NotificationSettingsResponseDto notificationSettingsResponseDto = webUserService.setAllNotificationSetting(
        userId, body);
    return ResponseEntity.ok().body(notificationSettingsResponseDto);
  }

  /**
   * 사용자 검색 API
   * @param keyword 검색 키워드 (닉네임 또는 Discord Snowflake)
   * @param searchType 검색 타입("nickname", "discord" 또는 "auto") - 자동 판별 기본값
   * @param page 페이지 번호 (기본값: 0)
   * @param size 페이지 크기 (기본값: 10)
   * @return 검색 결과 및 페이지 정보
   */
  @GetMapping("/find/users")
  public ResponseEntity<FindUserInfo> findUser (
      @RequestParam(required = false) String keyword,
      @RequestParam(defaultValue = "auto") String searchType,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size
  ) {
    AuthenticationUtil.validateUserHasAuthority(UserRole.USER);
    FindUserInfo result = webUserService.findUsers(keyword, searchType, page, size);
    return ResponseEntity.ok(result);
  }
}
