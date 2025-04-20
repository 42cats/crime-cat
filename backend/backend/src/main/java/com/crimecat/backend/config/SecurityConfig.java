package com.crimecat.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.crimecat.backend.auth.filter.JwtAuthenticationFilter;
import com.crimecat.backend.auth.filter.OAuth2TokenRefreshFilter;
import com.crimecat.backend.auth.handler.CustomOAuth2SuccessHandler;
import com.crimecat.backend.auth.service.DiscordOAuth2UserService;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final DiscordOAuth2UserService discordOAuth2UserService; // ✅ 생성자 주입
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomOAuth2SuccessHandler customOAuth2SuccessHandler;
    private final ServiceUrlConfig serviceUrlConfig;

    private final OAuth2TokenRefreshFilter oAuth2TokenRefreshFilter;
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)  // crsf 사이트간 위조공격 보호 해제.
                .formLogin(AbstractHttpConfigurer::disable)         // ← 기본 /login 폼 비활성화
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)) /// 세션인증 끔
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/oauth2/**", "login/**","/bot/v1/**", "/api/v1/**").permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\": \"Unauthorized\"}");
                        })
                )
                .oauth2Login(oauth2 -> oauth2
                        .loginPage(serviceUrlConfig.getDomain() + "/login") // 로그인 경로 설정
                        .successHandler(customOAuth2SuccessHandler)
//                        .defaultSuccessUrl("/auth/login-success", true) // 트루 반환(성공)시에 리다이렉트 될 경로
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(discordOAuth2UserService) // 디스코드에서 반환하는 유저정보 처리 하는곳
                        )
//                        .failureUrl("http://localhost:5173/failed")
                )
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(oAuth2TokenRefreshFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
