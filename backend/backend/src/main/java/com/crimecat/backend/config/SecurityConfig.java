package com.crimecat.backend.config;

import com.crimecat.backend.auth.filter.DiscordBotTokenFilter;
import com.crimecat.backend.auth.filter.JwtAuthenticationFilter;
import com.crimecat.backend.auth.filter.SignalServerTokenFilter;
import com.crimecat.backend.auth.handler.CustomOAuth2SuccessHandler;
import com.crimecat.backend.auth.handler.LoginSuccessHandler;
import com.crimecat.backend.auth.handler.SignupSuccessHandler;
import com.crimecat.backend.auth.service.DiscordLoginService;
import com.crimecat.backend.auth.service.DiscordOAuth2UserService;
import com.crimecat.backend.auth.service.DiscordSignupService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.function.Supplier;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AccountExpiredException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.NullSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@RequiredArgsConstructor
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

  private final DiscordOAuth2UserService discordOAuth2UserService; // 기존 서비스 (이전 버전 호환용)
  private final DiscordLoginService discordLoginService;
  private final DiscordSignupService discordSignupService;
  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final DiscordBotTokenFilter discordBotTokenFilter;
  private final SignalServerTokenFilter signalServerTokenFilter;
  private final CustomOAuth2SuccessHandler customOAuth2SuccessHandler; // 기존 핸들러 (이전 버전 호환용)
  private final LoginSuccessHandler loginSuccessHandler;
  private final SignupSuccessHandler signupSuccessHandler;
  private final CsrfTokenConfig csrfTokenConfig;
  private final ServiceUrlConfig serviceUrlConfig;

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.csrf(
            csrf ->
                csrf.csrfTokenRepository(csrfTokenConfig.csrfTokenRepository())
                    .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler())
                    .ignoringRequestMatchers(
                        "/actuator/health", // 도커 컴포즈 헬스체크
                        "/actuator/info", // 도커 컴포즈 헬스체크
                        "/api/v1/public/**", // 기존 공개 API
                        "/oauth2/**", // OAuth2 인증 경로
                        "/login/**", // 로그인 관련 경로
                        "/api/v1/auth/logout",
                        "/api/v1/auth/reissue",
                        "/bot/v1/**", // 디스코드 봇 API 경로
                        "/api/v1/signal/**", // Signal Server API 경로
                        "/api/v1/cloudflare/**", // Cloudflare Proxy API 경로
                        "/api/ssr/**", // SSR 엔드포인트 (크롤러용)
                        "/api/sitemap/**", // 동적 사이트맵 (크롤러용)
                        "/api/v1/csrf/token" // csrf 인증경로
                        )
                    .sessionAuthenticationStrategy((req, res, auth) -> {})
        ) // crsf 사이트간 위조공격 보호 해제.
        .formLogin(AbstractHttpConfigurer::disable) // ← 기본 /login 폼 비활성화
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // / 세션인증 끔
        /* ❶ SecurityContext는 절대 세션에 저장하지 않도록 명시 */
        .securityContext(sc -> sc.securityContextRepository(new NullSecurityContextRepository()))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(
                        "/actuator/health",
                        "/actuator/info",
                        "/oauth2/**",
                        "/bot/v1/**",
                        "/api/v1/signal/**", // Signal Server API 경로
                        "/api/v1/cloudflare/**", // Cloudflare Proxy API 경로
                        "/api/v1/auth/logout",
                        "/api/v1/auth/reissue",
                        "/api/v1/auth/block-status",
                        "/api/v1/auth/oauth2/error",
                        "/login/**",
                        "/api/v1/public/**",
                        "/api/ssr/**",  // SSR 엔드포인트 (크롤러용)
                        "/api/sitemap/**",  // 동적 사이트맵 (크롤러용)
                        "/api/v1/csrf/token")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .exceptionHandling(
            ex ->
                ex.authenticationEntryPoint(
                    (request, response, authException) -> {
                      response.setContentType("application/json");
                      response.setCharacterEncoding("UTF-8");

                      String errorCode = "UNAUTHORIZED";
                      String message = "인증 오류";

                      if (authException instanceof BadCredentialsException) {
                        errorCode = "BAD_CREDENTIALS";
                        message = "아이디 또는 비밀번호가 잘못되었습니다.";
                      } else if (authException instanceof UsernameNotFoundException) {
                        errorCode = "USER_NOT_FOUND";
                        message = "존재하지 않는 사용자입니다.";
                      } else if (authException instanceof AccountExpiredException) {
                        errorCode = "ACCOUNT_EXPIRED";
                        message = "계정이 만료되었습니다.";
                      } else if (authException instanceof CredentialsExpiredException) {
                        errorCode = "CREDENTIALS_EXPIRED";
                        message = "비밀번호가 만료되었습니다.";
                      } else if (authException instanceof DisabledException) {
                        errorCode = "ACCOUNT_DISABLED";
                        message = "계정이 비활성화되었습니다.";
                      } else if (authException instanceof LockedException) {
                        errorCode = "ACCOUNT_LOCKED";
                        message = "계정이 잠겼습니다.";
                      } else if (authException instanceof InsufficientAuthenticationException) {
                        errorCode = "INSUFFICIENT_AUTHENTICATION";
                        message = "인증 정보가 부족합니다.";
                      }
                      String jsonResponse =
                          String.format(
                              "{\"errorCode\": \"%s\", \"message\": \"%s\"}", errorCode, message);
                      response.getWriter().write(jsonResponse);
                    }))
        .oauth2Login(
            oauth2 ->
                oauth2
                    .loginPage("/login") // 로그인 경로 설정
                    .authorizationEndpoint(endpoint -> 
                        endpoint.baseUri("/oauth2/authorization"))
                    .userInfoEndpoint(userInfo -> 
                        userInfo.userService(new DelegatingOAuth2UserService()))
                    .successHandler(new DelegatingAuthenticationSuccessHandler())
                    .failureHandler((request, response, exception) -> {
                        // OAuth2 인증 실패 처리
                        String errorType = "unknown_error";
                        String blockInfo = "";
                        
                        if (exception instanceof OAuth2AuthenticationException) {
                            OAuth2Error error = ((OAuth2AuthenticationException) exception).getError();
                            errorType = error.getErrorCode();
                            
                            // 차단 정보가 있는 경우 URL에 포함
                            if ("account_blocked".equals(errorType) && error.getUri() != null) {
                                blockInfo = "&blockInfo=" + java.net.URLEncoder.encode(error.getUri(), java.nio.charset.StandardCharsets.UTF_8);
                            }
                        }
                        
                        // 특정 에러 타입에 따라 다른 페이지로 리다이렉션
                        if ("account_not_found".equals(errorType)) {
                            response.sendRedirect("https://" + serviceUrlConfig.getDomain() + "/login-error?type=account_not_found");
                        } else if ("account_blocked".equals(errorType)) {
                            response.sendRedirect("https://" + serviceUrlConfig.getDomain() + "/login-error?type=account_blocked" + blockInfo);
                        } else {
                            response.sendRedirect("https://" + serviceUrlConfig.getDomain() + "/login-error?type=" + errorType);
                        }
                    })
            )
        .addFilterBefore(discordBotTokenFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(signalServerTokenFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  // 클라이언트 ID에 따라 적절한 서비스로 위임하는 클래스
  private class DelegatingOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
      String clientRegistrationId = request.getClientRegistration().getRegistrationId();
      
      if ("discord-login".equals(clientRegistrationId)) {
        return discordLoginService.loadUser(request);
      } else if ("discord-signup".equals(clientRegistrationId)) {
        return discordSignupService.loadUser(request);
      } else if ("discord".equals(clientRegistrationId)) {
        // 기존 호환성 유지
        return discordOAuth2UserService.loadUser(request);
      } else {
        throw new OAuth2AuthenticationException(
          new OAuth2Error("invalid_client"), "지원하지 않는 클라이언트입니다.");
      }
    }
  }
  
  // 클라이언트 ID에 따라 적절한 핸들러로 위임하는 클래스
  private class DelegatingAuthenticationSuccessHandler implements AuthenticationSuccessHandler {
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, 
                                       HttpServletResponse response,
                                       Authentication authentication) 
        throws IOException, ServletException {
      
      String requestURI = request.getRequestURI();
      
      if (requestURI.contains("discord-login")) {
        loginSuccessHandler.onAuthenticationSuccess(request, response, authentication);
      } else if (requestURI.contains("discord-signup")) {
        signupSuccessHandler.onAuthenticationSuccess(request, response, authentication);
      } else {
        // 기본값으로 기존 핸들러 사용 (이전 버전 호환용)
        customOAuth2SuccessHandler.onAuthenticationSuccess(request, response, authentication);
      }
    }
  }

  final class SpaCsrfTokenRequestHandler implements CsrfTokenRequestHandler {
    private final CsrfTokenRequestHandler plain =
        new CsrfTokenRequestAttributeHandler();
    private final CsrfTokenRequestHandler xor =
        new XorCsrfTokenRequestAttributeHandler();

    @Override
    public void handle(HttpServletRequest request,
        HttpServletResponse response,
        Supplier<CsrfToken> csrfToken) {
      // BREACH 보호용 XOR 처리
      this.xor.handle(request, response, csrfToken);
      // 토큰을 쿠키로 밀어내기 위해 실제 값 로드
      csrfToken.get();
    }

    @Override
    public String resolveCsrfTokenValue(HttpServletRequest request,
        CsrfToken csrfToken) {
      String headerValue = request.getHeader(csrfToken.getHeaderName());
      return (org.springframework.util.StringUtils.hasText(headerValue)
          ? this.plain
          : this.xor).resolveCsrfTokenValue(request, csrfToken);
    }
  }

}
