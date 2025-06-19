package com.crimecat.backend.auth.filter;

import com.crimecat.backend.trace.annotation.NoTrace;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
@NoTrace
public class SignalServerTokenFilter extends OncePerRequestFilter {

  @Value("${spring.security.signal-server.secret-token}")
  private String SIGNAL_SERVER_SECRET_TOKEN;

  @Override
  protected void doFilterInternal(HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain)
      throws ServletException, IOException {

    String path = request.getRequestURI();

    if (!path.startsWith("/api/v1/signal")) {
      filterChain.doFilter(request, response);
      return;
    }

    String authHeader = request.getHeader("Authorization");
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      reject(response, "Missing or invalid Authorization header");
      return;
    }

    String signalServerToken = authHeader.substring(7);
    if (!signalServerToken.equals(SIGNAL_SERVER_SECRET_TOKEN)) {
      reject(response, "Invalid signal server token");
      return;
    }

    filterChain.doFilter(request, response);
  }

  private void reject(HttpServletResponse response, String message) throws IOException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType("application/json");
    response.getWriter().write("{\"error\": \"" + message + "\"}");
  }
}