package com.crimecat.backend.webUser.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.permission.service.PermissionService;
import com.crimecat.backend.point.service.PointHistoryService;
import com.crimecat.backend.storage.StorageService;
import com.crimecat.backend.user.repository.DiscordUserRepository;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.user.service.UserPermissionService;
import com.crimecat.backend.utils.UserDailyCheckUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.dto.WebUserProfileEditRequestDto;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
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
    private final ObjectMapper objectMapper;
    private static final String PROFILE_IMAGE_LOCATION = "profileImage";


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
        webUser.updateProfile(webUserProfileEditRequestDto, objectMapper);

        //프로필파일 저장
        if(file != null && !file.isEmpty()){
            try{
            String path = storageService.storeAt(file, PROFILE_IMAGE_LOCATION, webUser.getId().toString());
            webUser.setProfileImagePath(path);
      } catch (Exception e) {
                log.error("프로필 이미지 저장 실패 : {}", e.getMessage());
        throw ErrorStatus.UNPROCESSABLE_ENTITY.asServiceException();
      }
        }
        webUserRepository.save(webUser);
    }

}
