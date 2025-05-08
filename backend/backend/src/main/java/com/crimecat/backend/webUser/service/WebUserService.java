package com.crimecat.backend.webUser.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.permission.service.PermissionService;
import com.crimecat.backend.point.service.PointHistoryService;
import com.crimecat.backend.storage.StorageFileType;
import com.crimecat.backend.storage.StorageService;
import com.crimecat.backend.user.domain.DiscordUser;
import com.crimecat.backend.user.repository.DiscordUserRepository;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.user.service.UserPermissionService;
import com.crimecat.backend.utils.UserDailyCheckUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.dto.NicknameCheckResponseDto;
import com.crimecat.backend.webUser.dto.NotificationSettingsRequestDto;
import com.crimecat.backend.webUser.dto.NotificationSettingsResponseDto;
import com.crimecat.backend.webUser.dto.NotificationToggleRequest;
import com.crimecat.backend.webUser.dto.UserProfileInfoResponseDto;
import com.crimecat.backend.webUser.dto.WebUserProfileEditRequestDto;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebUserService {

    private final WebUserRepository webUserRepository;
    private final UserRepository userRepository;
    private final DiscordUserRepository discordUserRepository;
    private final UserDailyCheckUtil userDailyCheckUtil;
    private final PointHistoryService pointHistoryService;
    private final PermissionService permissionService;
    private final UserPermissionService userPermissionService;
    private final StorageService storageService;




    public ResponseEntity<Map<String, Object>> isDailyCheck(String userId) {
        webUserRepository.findById(UUID.fromString(userId))
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        Optional<LocalDateTime> existing = userDailyCheckUtil.load(userId);

        Map<String, Object> response = new HashMap<>();

        response.put("isComplete", existing.isPresent());
        response.put("checkTime", existing.isPresent() ? existing.toString() : "");
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @Transactional
    public ResponseEntity<Map<String, Object>> userDailyCheck(String userId) {
        WebUser webUser = webUserRepository.findById(UUID.fromString(userId))
            .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        Optional<LocalDateTime> existing = userDailyCheckUtil.load(userId);

        Map<String, Object> response = new HashMap<>();
        if (existing.isEmpty()) {
            userDailyCheckUtil.save(userId);
            pointHistoryService.dailyCheckPoint(webUser.getUser(),100);
            response.put("isComplete", true);
            response.put("checkTime", LocalDateTime.now()); // 현재 시간 기준으로 출석 시각 반환
            return ResponseEntity.ok(response);
        }
        throw ErrorStatus.INVALID_INPUT.asServiceException();
    }


    @Transactional
    public void userProfileSet(MultipartFile file, WebUserProfileEditRequestDto webUserProfileEditRequestDto){
        WebUser webUser = webUserRepository.findById(
                UUID.fromString(webUserProfileEditRequestDto.getUserId()))
            .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);

        //유저장보 업데이트
        if(webUserProfileEditRequestDto.getNickName() != null){
            Optional<WebUser> byNickname = webUserRepository.findByNickname(
                webUserProfileEditRequestDto.getNickName());
            if(byNickname.isPresent()){
                WebUser checker = byNickname.get();
                if (!webUser.getId().equals(checker.getId())){
                    throw ErrorStatus.NICK_NAME_ALREADY_EXISTS.asServiceException();
                }
            }
        }
        webUser.updateProfile(webUserProfileEditRequestDto);

        //프로필파일 저장
        if(file != null && !file.isEmpty()){
            try{
            String path = storageService.storeAt(StorageFileType.AVATAR, file, webUser.getId().toString());
            webUser.setProfileImagePath(path);
      } catch (Exception e) {
                log.error("프로필 이미지 저장 실패 : {}", e.getMessage());
        throw ErrorStatus.UNPROCESSABLE_ENTITY.asServiceException();
      }
        }
        webUserRepository.save(webUser);
    }

    @Transactional(readOnly = true)
    public NicknameCheckResponseDto checkNicknameDuplicate(String nickname) {
        log.info("닉네임 체크로직");
            if (nickname == null || nickname.trim().isEmpty()) {
                return NicknameCheckResponseDto.builder()
                    .available(false)
                    .message("닉네임을 입력해주세요.")
                        .build();
            }

            // 닉네임 길이 검사
            if (nickname.length() < 2 || nickname.length() > 20) {
                return NicknameCheckResponseDto.builder()
                    .available(false)
                    .message("닉네임은 2~20자 사이여야 합니다.")
                        .build();
            }

            // 닉네임 형식 검사 (특수문자 _, - 만 허용)
            if (!nickname.matches("^[\w가-힣_-]+$")) {
            return NicknameCheckResponseDto.builder()
                .available(false)
                .message("닉네임은 한글, 영문, 숫자, 언더바(_), 하이픈(-)만 사용 가능합니다.")
                    .build();
            }
        // 닉네임 중복 검사
        Optional<WebUser> existingUser = webUserRepository.findByNickname(nickname);

        if (existingUser.isPresent()) {
            return NicknameCheckResponseDto.builder()
                .available(true)
                .message("이미 사용 중인 닉네임입니다.")
                    .build();
        }

        return NicknameCheckResponseDto.builder()
            .available(true)
            .message("사용 가능한 닉네임입니다.")
                .build();
    }

    @Transactional(readOnly = true)
    public UserProfileInfoResponseDto getUserInfo(String userId) {
        WebUser webUser = webUserRepository.findById(UUID.fromString(userId))
            .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        return UserProfileInfoResponseDto.from(webUser);
    }

    @Transactional(readOnly = true)
    public NotificationSettingsResponseDto getUserNotificationSettings(String userId) {
        WebUser webUser = webUserRepository.findById(UUID.fromString(userId))
            .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        return NotificationSettingsResponseDto.from(webUser);
    }

    @Transactional
    public NotificationSettingsResponseDto setEmailAlarm(String userId, NotificationToggleRequest body) {
        WebUser webUser = webUserRepository.findById(UUID.fromString(userId))
            .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        webUser.setEmailAlarm(body.getEnabled());
        return NotificationSettingsResponseDto.from(webUser);
    }
    @Transactional
    public NotificationSettingsResponseDto setDiscordAlarm(String userId, NotificationToggleRequest body) {
        WebUser webUser = webUserRepository.findById(UUID.fromString(userId))
            .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        if(webUser.getUser().getDiscordUser() != null){
            DiscordUser discordUser = webUser.getUser()
                .getDiscordUser();
            discordUser.setDiscordAlarm(body.getEnabled());
        }
        return NotificationSettingsResponseDto.from(webUser);
    }

    @Transactional
    public NotificationSettingsResponseDto setAllNotificationSetting(String userId, NotificationSettingsRequestDto body) {
        WebUser webUser = webUserRepository.findById(UUID.fromString(userId))
            .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        if(webUser.getUser().getDiscordUser() != null){
            DiscordUser discordUser = webUser.getUser()
                .getDiscordUser();
            discordUser.setDiscordAlarm(body.getDiscord());
        }
        webUser.setEmailAlarm(body.getEmail());
        return NotificationSettingsResponseDto.from(webUser);
    }
}
