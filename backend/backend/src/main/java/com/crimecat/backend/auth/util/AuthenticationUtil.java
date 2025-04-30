package com.crimecat.backend.auth.util;

import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.bot.user.domain.DiscordUser;
import com.crimecat.backend.bot.user.domain.User;
import com.crimecat.backend.exception.CrimeCatException;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.web.webUser.UserRole;
import com.crimecat.backend.web.webUser.domain.WebUser;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * 현재 인증된 사용자의 정보를 쉽게 가져오기 위한 유틸리티 클래스
 */
@Component
@Slf4j
public class AuthenticationUtil {

  /**
   * 현재 인증된 사용자의 WebUser 객체를 반환합니다.
   * 인증되지 않은 사용자이거나 타입이 맞지 않으면 에러를 발생시킵니다.
   *
   * @return 인증된 사용자의 WebUser 객체
   * @throws CrimeCatException 인증되지 않았거나 유효하지 않은 사용자
   */
  public static WebUser getCurrentWebUser() {
    try {
      Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

      if (authentication == null || !authentication.isAuthenticated()) {
        throw ErrorStatus.UNAUTHORIZED.asException();
      }

      Object principal = authentication.getPrincipal();

      if (!(principal instanceof DiscordOAuth2User)) {
        throw ErrorStatus.INVALID_ACCESS.asException();
      }

      DiscordOAuth2User discordUser = (DiscordOAuth2User) principal;
      WebUser webUser = discordUser.getWebUser();

      if (webUser == null) {
        throw ErrorStatus.USER_NOT_FOUND.asException();
      }

      return webUser;
    } catch (ClassCastException e) {
      log.error("Invalid user type in authentication", e);
      throw ErrorStatus.INVALID_ACCESS.asException();
    } catch (Exception e) {
      if (e instanceof CrimeCatException) {
        throw e;
      }
      log.error("Authentication error", e);
      throw ErrorStatus.UNAUTHORIZED.asException();
    }
  }

  /**
   * 현재 인증된 사용자의 Discord User 사용자 객체를 반환합니다.
   *
   * @return 인증된 DiscordUser 사용자 객체
   */
  public static DiscordUser getCurrentDiscordUser() {
    WebUser currentUser = getCurrentWebUser();
    return currentUser.getUser().getDiscordUser();
  }

  /**
   * 현재 인증된 사용자의 통합 User 사용자 객체를 반환합니다.
   *
   * @return 통합 User 사용자 객체
   */
  public static User getCurrentUser() {
    WebUser currentUser = getCurrentWebUser();
    return currentUser.getUser();
  }

  /**
   * 현재 사용자가 인증되었는지 확인합니다.
   *
   * @return 인증 여부
   */
  public static boolean isAuthenticated() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    return authentication != null && authentication.isAuthenticated() &&
        authentication.getPrincipal() instanceof DiscordOAuth2User;
  }

  /**
   * 웹에서 전달받은 사용자 ID가 현재 인증된 사용자의 ID와 일치하는지 확인합니다.
   * 일치하지 않으면 에러를 발생시킵니다.
   *
   * @param userId 웹에서 전달받은 사용자 ID
   */
  public static void validateCurrentUserMatches(UUID userId) {
    WebUser currentUser = getCurrentWebUser();

    if (!currentUser.getId().equals(userId)) {
      throw ErrorStatus.FORBIDDEN.asException();
    }
  }

  /**
   * 현재 사용자가 특정 권한을 가지고 있는지 확인합니다.
   * 권한이 없으면 에러를 발생시킵니다.
   *
   * @param role 필요한 권한
   */
  public static void validateUserHasAuthority(UserRole role) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication == null || !authentication.isAuthenticated()) {
      throw ErrorStatus.UNAUTHORIZED.asException();
    }

    String roleWithPrefix = "ROLE_" + role.name();
    boolean hasAuthority = authentication.getAuthorities().stream()
        .anyMatch(authority -> authority.getAuthority().equals(roleWithPrefix));

    if (!hasAuthority) {
      throw ErrorStatus.FORBIDDEN.asException();
    }
  }

  /**
   * 사용자 ID와 필요한 권한을 모두 확인합니다.
   * ID가 일치하지 않거나 권한이 없으면 에러를 발생시킵니다.
   *
   * @param userId 웹에서 전달받은 사용자 ID
   * @param role 필요한 권한
   */
  public static void validateUserAndAuthority(UUID userId, UserRole role) {
    validateCurrentUserMatches(userId);
    validateUserHasAuthority(role);
  }

  /**
   * 현재 사용자가 관리자이거나 동일한 사용자인지 확인합니다.
   * (관리자는 다른 사용자의 데이터에 접근 가능하도록)
   *
   * @param userId 웹에서 전달받은 사용자 ID
   */
  public static void validateAdminOrSameUser(UUID userId) {
    WebUser currentUser = getCurrentWebUser();
    boolean isAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
        .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + UserRole.ADMIN.name()));

    if (!isAdmin && !currentUser.getId().equals(userId)) {
      throw ErrorStatus.FORBIDDEN.asException();
    }
  }

  /**
   * 현재 사용자가 해당 스노우플레이크의 소유자인지 확인합니다.
   *
   * @param snowflake 길드 소유자 ID
   */
  public static void validateDiscordSnowflake(String snowflake) {
    WebUser currentUser = getCurrentWebUser();

    if (!currentUser.getDiscordUserSnowflake().equals(snowflake)) {
      throw ErrorStatus.INVALID_ACCESS.asException();
    }
  }

  /**
   * 현재 사용자가 최소한 지정된 역할 이상인지 확인합니다.
   * (예: ADMIN은 MANAGER와 USER 권한도 가진 것으로 간주)
   *
   * @param minimumRole 최소 필요 역할
   */
  public static void validateUserHasMinimumRole(UserRole minimumRole) {
    WebUser currentUser = getCurrentWebUser();
    UserRole userRole = currentUser.getRole();

    // UserRole enum의 순서가 USER, MANAGER, ADMIN이라고 가정
    // ordinal 값이 클수록 권한이 높음
    if (userRole.ordinal() < minimumRole.ordinal()) {
      throw ErrorStatus.FORBIDDEN.asException();
    }
  }

  /**
   * 웹에서 전달받은 사용자 ID의 소유자에 대한 작업을 수행할 권한이 있는지 확인합니다.
   * 자신의 데이터이거나 필요한 역할 이상을 가진 사용자만 접근 가능
   *
   * @param userId 웹에서 전달받은 사용자 ID
   * @param minimumRole 이 역할 이상만 다른 사용자 데이터에 접근 가능
   */
  public static void validateSelfOrHasRole(UUID userId, UserRole minimumRole) {
    WebUser currentUser = getCurrentWebUser();

    // 본인의 데이터면 접근 허용
    if (currentUser.getId().equals(userId)) {
      return;
    }

    // 본인이 아니라면 최소 역할 확인
    UserRole userRole = currentUser.getRole();
    if (userRole.ordinal() < minimumRole.ordinal()) {
      throw ErrorStatus.FORBIDDEN.asException();
    }
  }

}