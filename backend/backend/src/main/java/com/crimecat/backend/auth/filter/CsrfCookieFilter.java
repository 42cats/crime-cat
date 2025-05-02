package com.crimecat.backend.auth.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CsrfCookieFilter extends OncePerRequestFilter {

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    CsrfToken token = (CsrfToken) request.getAttribute("_csrf");
    if (token != null) {
      Cookie cookie = new Cookie("XSRF-TOKEN", token.getToken());
      cookie.setPath("/");
      cookie.setHttpOnly(false);
      cookie.setSecure(true);
      cookie.setMaxAge(3600);
      response.addCookie(cookie);
    }
    filterChain.doFilter(request, response);
  }
}