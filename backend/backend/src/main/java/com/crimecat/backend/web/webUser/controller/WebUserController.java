package com.crimecat.backend.web.webUser.controller;

import com.crimecat.backend.web.webUser.service.WebUserService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/web_user")
public class WebUserController {

  private final WebUserService webUserService;

  @PostMapping("/daily_check/{user_id}")
  public ResponseEntity<Map<String, Object>> dailyCheck(@PathVariable("user_id") String userId) {
    return webUserService.userDailyCheck(userId);
  }
  @GetMapping("/daily_check/{user_id}")
  public ResponseEntity<Map<String, Object>> isDailyCheck(@PathVariable("user_id") String userId){
    return webUserService.isDailyCheck(userId);
  }
}
