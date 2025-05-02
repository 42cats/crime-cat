package com.crimecat.backend.auth.service;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.permission.service.PermissionService;
import com.crimecat.backend.user.domain.DiscordUser;
import com.crimecat.backend.user.repository.DiscordUserRepository;
import com.crimecat.backend.user.service.UserPermissionService;
import com.crimecat.backend.webUser.enums.LoginMethod;
import com.crimecat.backend.webUser.enums.UserRole;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import jakarta.transaction.Transactional;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.exception.ErrorStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.service.WebUserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiscordOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final WebUserService webUserService;
    private final UserRepository userRepository;
    private final WebUserRepository webUserRepository;
    private final DiscordUserRepository discordUserRepository;
    private final PermissionService permissionService;
    private final UserPermissionService userPermissionService;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = new DefaultOAuth2UserService().loadUser(request);
        String provider = request.getClientRegistration().getRegistrationId();
        OAuth2AccessToken discordAccessToken = request.getAccessToken();
        Map<String, Object> attributes = oauth2User.getAttributes();
        String discordId = (String) attributes.get("id");
        String email = (String) attributes.get("email");
        String username = (String) attributes.get("global_name");
        if (username == null || username.isBlank()) {
            username = (String) attributes.get("username"); // fallback
        }

        // 유저 저장 또는 업데이트
        WebUser webUser = processOAuthUser(discordId, email, username ,provider);// 리턴
        Instant expiresAt = discordAccessToken.getExpiresAt();
        long expiresInSeconds = Duration.between(Instant.now(), expiresAt).getSeconds();

        log.debug("여기까진 잘오나?={} ",webUser.toString());
        return new DiscordOAuth2User(
                webUser,
                attributes,
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + webUser.getRole())));
    }

    public Optional<User> getLoginUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        DiscordOAuth2User principal = (DiscordOAuth2User) authentication.getPrincipal();
        return userRepository.findByWebUser(principal.getWebUser());
    }

    public Optional<UUID> getLoginUserId() {
        return getLoginUser().map(User::getId);
    }

    /**
     * OAuth 로그인 시 사용자 정보를 기준으로 신규 생성 또는 기존 유저 반환
     *
     * @param discordUserId Discord OAuth에서 받아온 ID
     * @param email         사용자 이메일
     * @param nickname      글로벌 닉네임
     * @return 저장 또는 업데이트된 WebUser
     */
    @Transactional
    public WebUser processOAuthUser(String discordUserId, String email, String nickname, String provider) {
        log.info("🔍 [OAuth 처리 시작] discordUserId={}, email={}, nickname={}, provider={}, LoginMethod.valueOf(provider.toUpperCase())= {}", discordUserId, email, nickname, provider, LoginMethod.valueOf(provider.toUpperCase()));

        Optional<WebUser> userByEmail = webUserRepository.findWebUserByEmail(email);

        WebUser user = userByEmail.orElseGet(() -> {
            log.info("🆕 [신규 사용자] 이메일로 조회된 유저 없음 → 새로 생성");
            WebUser newUser = WebUser.builder()
                .discordUserSnowflake(discordUserId)
                .email(email)
                .nickname(nickname)
                .emailVerified(false)
                .isActive(true)
                .isBanned(false)
                .loginMethod(LoginMethod.valueOf(provider.toUpperCase()))
                .role(UserRole.USER)
                .createdAt(LocalDateTime.now())
                .lastLoginAt(LocalDateTime.now())
                .build();

            log.info("📦 [신규 유저 객체 생성] {}", newUser);
            newUser = webUserRepository.save(newUser);
            User u = User.builder()
                .isWithdraw(false)
                .webUser(newUser)
                .point(0)
                .discordSnowflake(discordUserId)
                .build();
            Optional<DiscordUser> discordUser = discordUserRepository.findBySnowflake(discordUserId);
            if (discordUser.isPresent()) {
                u.setDiscordUser(discordUser.get());
                u = userRepository.findByDiscordUser(discordUser.get()).orElse(u);
                u.setWebUser(newUser);
                /// 이벤트 최초 7일이내 권한 한달무료
                Instant eventStart = Instant.parse("2025-04-28T03:00:00Z"); // 한국시간 4/28 12:00
                Instant eventEnd = eventStart.plus(Duration.ofDays(7)); // 일주일 후 종료
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
        });

        // Discord ID 업데이트 여부 확인
        if (user.getDiscordUserSnowflake() == null || !user.getDiscordUserSnowflake().equals(discordUserId)) {
            log.info("🔁 [디스코드 ID 변경] 기존={}, 새 ID={}", user.getDiscordUserSnowflake(), discordUserId);
            user.setDiscordUserSnowflake(discordUserId);
            webUserRepository.save(user);
        } else {
            log.info("✅ [기존 사용자] ID 업데이트 불필요");
        }
        user.setLastLoginAt(LocalDateTime.now());
        log.info("🎉 [OAuth 처리 완료] userId={}, nickname={}", user.getDiscordUserSnowflake(), user.getNickname());
        return user;
    }

    @Transactional
    public void permissionsSet(User user, String name) {
        Permission permission = permissionService.findPermissionByPermissionName(name);
        if (permission != null) {
            userPermissionService.purchasePermission(user.getDiscordUser(), permission);
        }
    }

}
