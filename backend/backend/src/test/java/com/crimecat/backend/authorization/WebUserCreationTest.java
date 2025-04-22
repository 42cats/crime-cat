package com.crimecat.backend.authorization;

import com.crimecat.backend.web.webUser.LoginMethod;
import com.crimecat.backend.web.webUser.UserRole;
import com.crimecat.backend.web.webUser.domain.WebUser;
import com.crimecat.backend.web.webUser.repository.WebUserRepository;
import com.crimecat.backend.web.webUser.service.WebUserService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class WebUserCreationTest {

    @Autowired
    private WebUserRepository userRepository;

    @Autowired
    private WebUserService userService;

    private final String discordId = "1234567890";
    private final String email = "test@discord.com";
    private final String nickname = "짭냥이";
    private final String provider = "DISCORD";

    @BeforeEach
    void clean() {
        userRepository.deleteAll();
    }

    @Test
    @Order(1)
    void test1_정상_유저_생성() {
        WebUser user = userService.processOAuthUser(discordId, email, nickname, provider);

        assertThat(user.getDiscordUserSnowflake()).isEqualTo(discordId);
        assertThat(user.getEmail()).isEqualTo(email);
        assertThat(user.getNickname()).isEqualTo(nickname);
        assertThat(user.getLoginMethod()).isEqualTo(LoginMethod.DISCORD);
    }

    @Test
    @Order(2)
    void test2_중복_생성시_기존유저_반환() {
        WebUser first = userService.processOAuthUser(discordId, email, nickname,provider);
        WebUser second = userService.processOAuthUser(discordId, email, nickname, provider);

        assertThat(second.getId()).isEqualTo(first.getId()); // 같은 유저
        assertThat(userRepository.count()).isEqualTo(1);     // 1명만 존재
    }

    @Test
    @Order(3)
    void test3_닉네임_누락시_예외() {
        assertThatThrownBy(() -> userService.processOAuthUser(discordId, email, null, provider))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("nickname");
    }

    @Test
    @Order(4)
    void test4_기본값_자동_설정_확인() {
        WebUser user = userService.processOAuthUser(discordId, email, nickname, provider);

        assertThat(user.getRole()).isEqualTo(UserRole.USER);
        assertThat(user.getIsActive()).isTrue();
        assertThat(user.getIsBanned()).isFalse();
        assertThat(user.getCreatedAt()).isNotNull();
    }

    @Test
    @Order(5)
    void test5_이메일_중복시_예외_또는_갱신_정책_검증() {
        userService.processOAuthUser(discordId, email, nickname,provider);
        // 새로운 Discord ID지만 같은 이메일로 유저 생성 시 예외가 발생해야 하는 정책이라면:
        assertThatThrownBy(() ->
                userService.processOAuthUser("999999", email, "다른닉네임", provider))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("이미 존재");
    }

    @Test
    @Order(6)
    void test6_로그인방식이_DISCORD으로_설정되는지() {
        WebUser user = userService.processOAuthUser(discordId, email, nickname,provider);
        assertThat(user.getLoginMethod()).isEqualTo(LoginMethod.DISCORD);
    }

    @Test
    @Order(6)
    void test6_로그인방식이_GOOGLE으로_설정되는지() {
        WebUser user = userService.processOAuthUser(discordId, email, nickname,"google");
        assertThat(user.getLoginMethod()).isEqualTo(LoginMethod.GOOGLE);
    }
    @Test
    @Order(6)
    void test6_로그인방식이_LOCAL_으로_설정되는지() {
        WebUser user = userService.processOAuthUser(discordId, email, nickname,"local");
        assertThat(user.getLoginMethod()).isEqualTo(LoginMethod.GOOGLE);
    }
}
