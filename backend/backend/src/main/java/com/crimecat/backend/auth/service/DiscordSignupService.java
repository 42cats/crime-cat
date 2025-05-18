package com.crimecat.backend.auth.service;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.permission.service.PermissionService;
import com.crimecat.backend.user.domain.DiscordUser;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.DiscordUserRepository;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.user.service.UserPermissionService;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.enums.LoginMethod;
import com.crimecat.backend.webUser.enums.UserRole;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import com.crimecat.backend.webUser.service.WebUserService;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service("discordSignupService")
public class DiscordSignupService extends BaseDiscordOAuth2UserService {
    
    // 생성자 (의존성 주입)
    public DiscordSignupService(WebUserService webUserService, 
                               UserRepository userRepository,
                               WebUserRepository webUserRepository,
                               DiscordUserRepository discordUserRepository,
                               PermissionService permissionService,
                               UserPermissionService userPermissionService) {
        super(webUserService, userRepository, webUserRepository, discordUserRepository, 
              permissionService, userPermissionService);
    }
    
    @Override
    protected WebUser processUser(String discordId, String email, String username, String provider) {
        // 이미 가입된 사용자인지 확인
        Optional<WebUser> existingUser = webUserRepository.findByDiscordUserSnowflake(discordId);
        if (existingUser.isPresent()) {
            log.error("이미 가입된 사용자입니다.");
            throw new OAuth2AuthenticationException(new OAuth2Error("already_registered"), 
                "이미 가입된 Discord 계정입니다. 로그인을 진행해주세요.");
        }
        
        // 신규 사용자 생성
        String finalNickname = generateUniqueNickname(username);
        
        WebUser newUser = WebUser.builder()
            .discordUserSnowflake(discordId)
            .email(email)
            .nickname(finalNickname)
            .emailVerified(false)
            .isActive(true)
            .isBanned(false)
            .loginMethod(LoginMethod.valueOf(provider.toUpperCase()))
            .role(UserRole.USER)
            .createdAt(LocalDateTime.now())
            .lastLoginAt(LocalDateTime.now())
            .build();
            
        newUser = webUserRepository.save(newUser);
        
        // User 객체 생성 및 저장
        User u = User.builder()
            .isWithdraw(false)
            .webUser(newUser)
            .point(0)
            .discordSnowflake(discordId)
            .build();
            
        // Discord 유저 연결 및 이벤트 처리 (기존 코드 재사용)
        Optional<DiscordUser> discordUser = discordUserRepository.findBySnowflake(discordId);
        if (discordUser.isPresent()) {
            u.setDiscordUser(discordUser.get());
            u = userRepository.findByDiscordUser(discordUser.get()).orElse(u);
            u.setWebUser(newUser);
            
            // 이벤트 특전 설정 (기존 코드 재사용)
            Instant eventStart = Instant.parse("2025-04-28T03:00:00Z");
            Instant eventEnd = eventStart.plus(Duration.ofDays(7));
            Instant now = Instant.now();

            if (!now.isBefore(eventStart) && !now.isAfter(eventEnd)) {
                this.permissionsSet(u, "관전");
                this.permissionsSet(u, "주소추가");
                this.permissionsSet(u, "로컬음악");
                this.permissionsSet(u, "메시지매크로");
            }
        }

        userRepository.save(u);
        
        return newUser;
    }
    
    // 권한 설정 메소드 (기존 코드 재사용)
    @Transactional
    public void permissionsSet(User user, String name) {
        Permission permission = permissionService.findPermissionByPermissionName(name);
        if (permission != null) {
            userPermissionService.purchasePermission(user.getDiscordUser(), permission);
        }
    }
    
    // 고유 닉네임 생성 메소드 (기존 코드 재사용)
    private String generateUniqueNickname(String nickname) {
        // 기본 닉네임 유효성 검사
        if (nickname == null || nickname.trim().isEmpty()) {
            nickname = "User"; // 기본값 설정
        }
        
        // 20자 제한 (숫자 추가 여유 공간 확보)
        if (nickname.length() > 16) {
            nickname = nickname.substring(0, 16);
        }
        
        String baseNickname = nickname;
        String uniqueNickname = baseNickname;
        int suffix = 1;
        
        // 닉네임 중복 확인 및 숫자 추가 로직
        while (true) {
            Optional<WebUser> existingUser = webUserRepository.findByNickname(uniqueNickname);
            
            if (existingUser.isEmpty()) {
                // 중복 없음 - 현재 닉네임 사용 가능
                return uniqueNickname;
            }
            
            // 중복 발견 - 숫자 접미사 추가 후 다시 확인
            uniqueNickname = baseNickname + suffix;
            
            // 20자 제한 확인
            if (uniqueNickname.length() > 20) {
                // 기존 닉네임을 더 줄여서 숫자를 추가할 공간 확보
                baseNickname = baseNickname.substring(0, baseNickname.length() - 1);
                uniqueNickname = baseNickname + suffix;
            }
            
            suffix++;
            
            // 안전장치: 최대 1000번 반복 후 임의의 고유 식별자 추가
            if (suffix > 1000) {
                uniqueNickname = baseNickname + UUID.randomUUID().toString().substring(0, 4);
                break;
            }
        }
        
        return uniqueNickname;
    }
}
