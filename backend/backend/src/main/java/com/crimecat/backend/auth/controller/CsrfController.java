package com.crimecat.backend.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/csrf")
public class CsrfController {

  /**
   * CSRF 토큰만 쿠키로 내려주고, 본문은 비워 204(No Content)로 응답한다.
   *
   * ⚙️ 작동 흐름
   * 1) `CsrfToken` 파라미터가 주입되는 순간 Spring Security가
   *    ─ 토큰이 없으면 새로 생성
   *    ─ `CookieCsrfTokenRepository`를 통해 **Set‑Cookie: XSRF‑TOKEN=…** 헤더 추가
   * 2) 우리는 토큰 값을 반환하지 않고 `204` 상태 코드만 내려
   *    네트워크 트래픽을 최소화한다.
   */
  @GetMapping("/token")
  public ResponseEntity<Void> issueCsrfToken(CsrfToken token) {
    token.getToken();               // ⬅️ ❶ deferred token을 강제로 로드해 쿠키 발급 유도 :contentReference[oaicite:0]{index=0}
    return ResponseEntity
        .noContent()             // ⬅️ 204 No Content
        .build();
  }
}
