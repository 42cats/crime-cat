package com.crimecat.backend.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("/api/v1/")
public class CsrfController {

  @GetMapping("/csrf/token")
  public void getCsrfToken(HttpServletRequest request){
  }
}
