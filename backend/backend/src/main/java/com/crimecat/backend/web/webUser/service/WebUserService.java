package com.crimecat.backend.web.webUser.service;

import java.time.LocalDateTime;
import java.util.Optional;

import com.crimecat.backend.bot.user.domain.DiscordUser;
import com.crimecat.backend.bot.user.domain.User;
import com.crimecat.backend.bot.user.repository.DiscordUserRepository;
import com.crimecat.backend.bot.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import com.crimecat.backend.web.webUser.LoginMethod;
import com.crimecat.backend.web.webUser.UserRole;
import com.crimecat.backend.web.webUser.domain.WebUser;
import com.crimecat.backend.web.webUser.repository.WebUserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebUserService {

    private final WebUserRepository webUserRepository;
    private final UserRepository userRepository;

    /**
     * OAuth 로그인 시 사용자 정보를 기준으로 신규 생성 또는 기존 유저 반환
     * @param discordUserId Discord OAuth에서 받아온 ID
     * @param email 사용자 이메일
     * @param nickname 글로벌 닉네임
     * @return 저장 또는 업데이트된 WebUser
     */
    @Transactional
    public WebUser processOAuthUser(String discordUserId, String email, String nickname, String provider) {
        log.info("🔍 [OAuth 처리 시작] discordUserId={}, email={}, nickname={}, provider={}, LoginMethod.valueOf(provider.toUpperCase())= {}", discordUserId, email, nickname , provider ,LoginMethod.valueOf(provider.toUpperCase()) );

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
            userRepository.save(User.builder().webUser(newUser).build());
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
}
