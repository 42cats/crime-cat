package com.crimecat.backend.authorization;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.service.JwtBlacklistService;
import com.crimecat.backend.auth.service.RefreshTokenService;
import com.crimecat.backend.web.webUser.domain.WebUser;
import com.crimecat.backend.web.webUser.repository.WebUserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private JwtBlacklistService jwtBlacklistService;
    @Autowired private RefreshTokenService refreshTokenService;
    @Autowired private WebUserRepository webUserRepository;
    @Autowired private RedisTemplate<String, String> redisTemplate;

    private final String userId = "317655426868969482";

    private WebUser createUser() {
        WebUser user = WebUser.builder()
                .id(UUID.randomUUID())
                .discordUserId(userId)
                .nickname("변상훈")
                .email("test@discord.com")
                .isActive(true)
                .isBanned(false)
                .build();
        return webUserRepository.save(user);
    }

    @Test
    void test1_토큰_쿠키_생성_및_검증() {
        String token = jwtTokenProvider.createAccessToken(userId, "변상훈");
        String refresh = jwtTokenProvider.createRefreshToken(userId);

        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUserIdFromToken(token)).isEqualTo(userId);
        assertThat(refresh).isNotEmpty();
    }

    @Test
    void test2_블랙리스트_등록_후_검사() {
        String token = jwtTokenProvider.createAccessToken(userId, "변상훈");
        jwtBlacklistService.blacklistToken(token, jwtTokenProvider.getRemainingTime(token));
        assertThat(jwtBlacklistService.isBlacklisted(token)).isTrue();
    }

    @Test
    void test3_RefreshToken_저장_조회_삭제() {
        String refresh = jwtTokenProvider.createRefreshToken(userId);
        refreshTokenService.saveRefreshToken(userId, refresh);
        String redisToken = refreshTokenService.getRefreshToken(userId);
        assertThat(redisToken).isEqualTo(refresh);

        refreshTokenService.deleteRefreshToken(userId);
        assertThat(refreshTokenService.getRefreshToken(userId)).isNull();
    }

    @Test
    void test4_인증_필터가_사용자_등록_성공() throws Exception {
        WebUser user = createUser();
        String token = jwtTokenProvider.createAccessToken(user.getDiscordUserSnowflake(), user.getNickname());

        mockMvc.perform(get("/some/protected/api") // 실제 보호된 엔드포인트
                        .cookie(new Cookie("Authorization", token)))
                .andExpect(status().isOk());
    }

    @Test
    void test5_블랙리스트_토큰_거부_확인() throws Exception {
        WebUser user = createUser();
        String token = jwtTokenProvider.createAccessToken(user.getDiscordUserSnowflake(), user.getNickname());
        jwtBlacklistService.blacklistToken(token, jwtTokenProvider.getRemainingTime(token));

        mockMvc.perform(get("/some/protected/api")
                        .cookie(new Cookie("Authorization", token)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void test6_잘못된_토큰_거부() throws Exception {
        String fakeToken = "abc.def.ghi"; // 포맷은 맞지만 서명 위조
        mockMvc.perform(get("/some/protected/api")
                        .cookie(new Cookie("Authorization", fakeToken)))
                .andExpect(status().isUnauthorized());
    }
}
