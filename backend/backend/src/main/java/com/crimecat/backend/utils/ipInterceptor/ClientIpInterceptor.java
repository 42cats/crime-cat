package com.crimecat.backend.utils.ipInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class ClientIpInterceptor implements HandlerInterceptor {
  @Override
  public boolean preHandle(
      HttpServletRequest request,
      HttpServletResponse response,
      Object handler
  ) {
    String xff = request.getHeader("X-Forwarded-For");
    String clientIp = xff != null
        ? xff.split(",")[0].trim()
        : request.getRemoteAddr();

    // 요청 스코프에 attribute로 저장
    request.setAttribute("clientIp", clientIp);
    return true;
  }
}
