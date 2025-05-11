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
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.utils.UserDailyCheckUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.dto.FindUserInfo;
import com.crimecat.backend.webUser.dto.NicknameCheckResponseDto;
import com.crimecat.backend.webUser.dto.NotificationSettingsRequestDto;
import com.crimecat.backend.webUser.dto.NotificationSettingsResponseDto;
import com.crimecat.backend.webUser.dto.NotificationToggleRequest;
import com.crimecat.backend.webUser.dto.UserProfileInfoResponseDto;
import com.crimecat.backend.webUser.dto.UserSearchResponseDto;
import com.crimecat.backend.webUser.dto.WebUserProfileEditRequestDto;
import com.crimecat.backend.webUser.enums.UserRole;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
            if (!nickname.matches("^[\\w가-힣_-]+$")) {
            return NicknameCheckResponseDto.builder()
                .available(false)
                .message("닉네임은 한글, 영문, 숫자, 언더바(_), 하이픈(-)만 사용 가능합니다.")
                    .build();
            }
            
            // 관리자/운영자 사칭 닉네임 필터링
            if (isImpersonatingStaff(nickname)) {
                try{

                    AuthenticationUtil.validateUserHasAuthority(UserRole.ADMIN);

                }

                catch (Exception e) {

                    return NicknameCheckResponseDto.builder()
                    .available(false)
                    .message("관리자, 운영자 등의 공식 계정을 사칭하는 닉네임은 사용할 수 없습니다.")
                    .build();

                }
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
    
    /**
     * 관리자/운영자 사칭 닉네임인지 확인하는 메소드
     * @param nickname 확인할 닉네임
     * @return 사칭 여부 (true: 사칭, false: 정상)
     */
    private boolean isImpersonatingStaff(String nickname) {
        // 소문자로 변환하여 비교
        String lowerNickname = nickname.toLowerCase();
        
        // 금지할 키워드 목록
        String[] restrictedKeywords = {
            "admin", "administrator", "어드민", "관리자", "운영자", "매니저", "스태프", "staff", "official", 
            "crime_cat", "crimecat", "크라임캣", "공식", "moderator", "모더레이터", "mod", "dev", "developer", "개발자",
            "master", "마스터", "ceo", "대표", "support", "서포트", "system", "시스템", "help", "헬프",
            "service", "서비스", "team", "팀", "owner", "오너", "police", "경찰", "customer_service", "고객센터"
        };
        
        // 접두사/접미사로 함께 확인할 단어들
        String[] modifiers = {
            "_", "-", "0", "o", "official", "공식", "real", "진짜", "original", "오리지널",
            "team", "팀", "crew", "크루", "main", "메인", "chief", "총괄"
        };
        
        // 기본 키워드 확인
        for (String keyword : restrictedKeywords) {
            // 정확히 일치하는 경우
            if (lowerNickname.equals(keyword)) {
                return true;
            }
            
            // 포함되어 있는 경우 (부분 일치)
            if (lowerNickname.contains(keyword)) {
                // 추가 확인: 접두사/접미사가 있는 경우
                for (String modifier : modifiers) {
                    if (lowerNickname.contains(keyword + modifier) || 
                        lowerNickname.contains(modifier + keyword)) {
                        return true;
                    }
                }
            }
        }
        
        // [관리자], (운영자), 『스태프』 등 특수 기호로 강조된 형태 확인
        String cleanNickname = lowerNickname.replaceAll("[\\[\\]\\(\\)\\{\\}『』〈〉「」《》<>]", "");
        if (!cleanNickname.equals(lowerNickname)) {
            // 특수 기호가 제거된 상태에서 다시 키워드 확인
            for (String keyword : restrictedKeywords) {
                if (cleanNickname.contains(keyword)) {
                    return true;
                }
            }
        }
        
        return false;
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

  /**
   * 사용자 검색 메소드
   * @param keyword 검색 키워드
   * @param searchType 검색 타입 ("nickname", "discord" 또는 "auto")
   * @param page 페이지 번호
   * @param size 페이지 크기
   * @return 검색 결과를 담은 FindUserInfo 객체
   */
  @Transactional(readOnly = true)
  public FindUserInfo findUsers(String keyword, String searchType, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<UserSearchResponseDto> resultPage;
    
    if (keyword == null || keyword.trim().isEmpty()) {
      // 키워드가 없는 경우 빈 결과 반환
      return FindUserInfo.builder()
          .content(java.util.Collections.emptyList())
          .page(page)
          .size(size)
          .totalPages(0)
          .totalElements(0)
          .hasNext(false)
          .hasPrevious(false)
          .searchType(searchType)
          .build();
    }
    
    // 검색 타입이 자동일 경우, 키워드 형식에 따라 검색 타입 결정
    if ("auto".equalsIgnoreCase(searchType) || searchType == null) {
      searchType = determineSearchType(keyword);
    }
    
    if ("discord".equalsIgnoreCase(searchType)) {
      // Discord Snowflake 검색
      Page<WebUser> users = webUserRepository.findByDiscordUserSnowflake(keyword, pageable);
      resultPage = users.map(UserSearchResponseDto::fromForDiscordSnowflake);
    } else {
      // 기본값은 닉네임 검색: 부분 일치
      Page<WebUser> users = webUserRepository.findByNicknameContaining(keyword, pageable);
      resultPage = users.map(UserSearchResponseDto::fromForNickname);
    }
    
    return FindUserInfo.from(resultPage, searchType);
  }
  
  /**
   * 키워드 형식에 따라 검색 타입을 결정하는 메소드
   * @param keyword 검색 키워드
   * @return 결정된 검색 타입 ("nickname" 또는 "discord")
   */
  private String determineSearchType(String keyword) {
    // Discord Snowflake 형식 확인 (17-19자리 숫자 문자열)
    if (isDiscordSnowflake(keyword)) {
      return "discord";
    }
    
    // 기본은 닉네임 검색
    return "nickname";
  }
  
  /**
   * Discord Snowflake 형식인지 확인하는 메소드
   * @param value 확인할 문자열
   * @return Discord Snowflake 이면 true, 아니면 false
   */
  private boolean isDiscordSnowflake(String value) {
    // Discord Snowflake는 일반적으로 17-19자리의 숫자로 이루어진 문자열
    if (value == null || value.length() < 17 || value.length() > 19) {
      return false;
    }
    
    // 모든 문자가 숫자인지 확인
    return value.matches("^\\d+$");
  }
}