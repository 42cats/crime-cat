package com.crimecat.backend.stats.controller;

import com.crimecat.backend.stats.service.WebStatsInfoService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/public/info/stats")
public class WebStatsInfo {

  private final WebStatsInfoService webStatsInfoService;

  @GetMapping("/main")
  public ResponseEntity<Map<String,String>> mainInfoStats(){
    return webStatsInfoService.mainStatInfo();
  }
}
