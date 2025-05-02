package com.crimecat.backend.config;

import com.crimecat.backend.auth.filter.CsrfCookieFilter;
import com.crimecat.backend.auth.filter.DiscordBotTokenFilter;
import com.crimecat.backend.auth.filter.JwtAuthenticationFilter;
import com.crimecat.backend.auth.handler.CustomOAuth2SuccessHandler;
import com.crimecat.backend.auth.service.DiscordOAuth2UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.util.StringUtils;

@RequiredArgsConstructor
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final DiscordOAuth2UserService discordOAuth2UserService; // ✅ 생성자 주입
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final DiscordBotTokenFilter discordBotTokenFilter;
    private final CustomOAuth2SuccessHandler customOAuth2SuccessHandler;
    private final CsrfTokenConfig csrfTokenConfig;
    private final CsrfCookieFilter csrfCookieFilter;

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
                        "/bot/v1/**", // 디스코드 봇 API 경로\
                        "/api/v1/csrf/token" // csrf 인증경로
                        )) // crsf 사이트간 위조공격 보호 해제.
        .addFilterAfter(csrfCookieFilter, BasicAuthenticationFilter.class)
        .formLogin(AbstractHttpConfigurer::disable) // ← 기본 /login 폼 비활성화
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // / 세션인증 끔
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(
                        "/actuator/health",
                        "/actuator/info",
                        "/oauth2/**",
                        "/bot/v1/**",
                        "/login/**",
                        "/api/v1/public/**",
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
                    .successHandler(customOAuth2SuccessHandler)
                    // .defaultSuccessUrl("/", true) // 트루 반환(성공)시에 리다이렉트 될 경로
                    // .failureUrl("/")
                    .userInfoEndpoint(
                        userInfo ->
                            userInfo.userService(
                                discordOAuth2UserService) // 디스코드에서 반환하는 유저정보 처리 하는곳
                        )
            //                        .failureUrl("http://localhost:5173/failed")
            )
        .addFilterBefore(discordBotTokenFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
  final class SpaCsrfTokenRequestHandler extends CsrfTokenRequestAttributeHandler {
    private final CsrfTokenRequestHandler delegate = new XorCsrfTokenRequestAttributeHandler();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, Supplier<CsrfToken> csrfToken) {
      this.delegate.handle(request, response, csrfToken);
    }

    @Override
    public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
      if (StringUtils.hasText(request.getHeader(csrfToken.getHeaderName()))) {
        return super.resolveCsrfTokenValue(request, csrfToken);
      }
      return this.delegate.resolveCsrfTokenValue(request, csrfToken);
    }
  }
}
