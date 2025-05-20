package com.crimecat.backend.webUser.controller;

import com.crimecat.backend.webUser.dto.ProfileDetailDto;
import com.crimecat.backend.webUser.service.WebUserService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping(
    value    = "/api/v1/public/web_users",
    produces = MediaType.APPLICATION_JSON_VALUE   // ← 여기에 JSON만 생산하겠다고 선언
)
public class WebUserPublicController {
  private final WebUserService webUserService;

  @GetMapping("/{user_id}/profile/detail")
  public ResponseEntity<ProfileDetailDto> getUserProfile(@PathVariable("user_id") UUID userId){
    return ResponseEntity.ok().body(webUserService.getUserProfileDetail(userId));
  }
}
