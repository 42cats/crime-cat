package com.crimecat.backend.init;

import com.crimecat.backend.config.AdminProperties;
import com.crimecat.backend.permission.service.PermissionService;
import com.crimecat.backend.user.domain.DiscordUser;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.DiscordUserRepository;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.enums.UserRole;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminUserRunner implements ApplicationRunner {

  private final UserRepository userRepository;
  private final WebUserRepository webUserRepository;
  private final DiscordUserRepository discordUserRepository;
  private final AdminProperties adminProperties;
  private final PermissionService permissionService;

  @Override
  public void run(ApplicationArguments args) {

    // 이미 있으면 건너뜀
    Optional<WebUser> webUserByEmail =
        webUserRepository.findWebUserByEmail(adminProperties.getUsername());

    if (webUserByEmail.isPresent()) return;

    log.info("owner = {}",adminProperties.getOwner());
    log.info("discord secret = {}", adminProperties.getPassword());
    // 없으면 생성
    WebUser webUser =
        WebUser.builder()
            .nickname("관리자")
            .email(adminProperties.getUsername())
            .passwordHash(adminProperties.getPassword()) // 실제로는 인코딩 필요
            .role(UserRole.ADMIN)
            .discordUserSnowflake(adminProperties.getOwner())
            .build();

    webUserRepository.save(webUser);
    DiscordUser discordUser =
        DiscordUser.of(adminProperties.getOwner(), "어드민", "");

    discordUserRepository.save(discordUser);

    User admin =
        User.builder()
            .webUser(webUser)
            .discordUser(discordUser)
            .discordSnowflake(adminProperties.getOwner())
            .build();

    userRepository.save(admin);
    System.out.println("✅ 어드민 계정 생성됨: " + adminProperties.getUsername());

    permissionService.savePermission("관전", 2000,28, "디스코드 서버에서 나가도 /관전 명령어도 다시 관전하러 들어갈 수 있습니다.");
    permissionService.savePermission("주소추가", 3000,28,"유튜브 주소를 15개 이상 등록할 수 있습니다.");
    permissionService.savePermission("로컬음악", 3000,28, "음악파일을 저장해서 음악플레이어로 재생할 수 있습니다. (100M제한)");
    permissionService.savePermission("메시지매크로", 3000,28, "진행에 도움이 되는 버튼매크로 편집기를 이용해서 버튼 명령어를 사용할 수 있습니다. 편리한 진행을 원한다면 바로 사용해 보세요.");

  }
}
