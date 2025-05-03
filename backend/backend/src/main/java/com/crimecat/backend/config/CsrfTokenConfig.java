package com.crimecat.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.web.csrf.*;

@Configuration
public class CsrfTokenConfig {

  private static final String COOKIE_NAME = "XSRF-TOKEN";
  private static final String HEADER_NAME = "X-XSRF-TOKEN";
  private static final String PARAM_NAME  = "_csrf";   // 기본값

  @Bean
  public CsrfTokenRepository csrfTokenRepository() {

    // 쿠키 설정 전부 담당할 기본 레포지토리
    CookieCsrfTokenRepository delegate = CookieCsrfTokenRepository.withHttpOnlyFalse();
    delegate.setCookieName(COOKIE_NAME);
    delegate.setHeaderName(HEADER_NAME);
    delegate.setCookiePath("/");

    /* 토큰만 짧게(16 byte → 22~24 글자) 생성하는 래퍼 */
    return new CsrfTokenRepository() {

      private final SecureRandom random = new SecureRandom();

      @Override
      public CsrfToken generateToken(HttpServletRequest request) {
        byte[] bytes = new byte[16];   // 128‑bit
        random.nextBytes(bytes);
        String value = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(bytes);
        return new DefaultCsrfToken(HEADER_NAME, PARAM_NAME, value);
      }

      @Override
      public void saveToken(CsrfToken token,
          HttpServletRequest request,
          HttpServletResponse response) {
        delegate.saveToken(token, request, response);   // 쿠키 쓰기
      }

      @Override
      public CsrfToken loadToken(HttpServletRequest request) {
        return delegate.loadToken(request);             // 쿠키 읽기
      }
    };
  }
}
