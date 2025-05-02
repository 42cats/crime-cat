package com.crimecat.backend.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController()
public class CsrfController {

  @GetMapping("/api/v1/csrf/token")
  public void getCsrfToken(HttpServletRequest request, HttpServletResponse response) {
    log.info("토큰 겟 호출");

    // 토큰을 명시적으로 요청 및 응답에 바인딩
    CsrfToken token = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
    if (token != null) {
      // 응답 헤더에 토큰 추가
      response.setHeader(token.getHeaderName(), token.getToken());
    }
  }
}
