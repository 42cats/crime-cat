package com.crimecat.backend.stats.controller;

import com.crimecat.backend.stats.service.WebStatsInfoService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/info")
@RequiredArgsConstructor
public class WebPersonalInfo {

  private final WebStatsInfoService webStatsInfoService;

  @GetMapping("/{id}")
  public ResponseEntity<Map<String,String>> personalInfoDashboard(@PathVariable("id") String id){
    return webStatsInfoService.personalInfoOnDashBord(id);
  }
}
