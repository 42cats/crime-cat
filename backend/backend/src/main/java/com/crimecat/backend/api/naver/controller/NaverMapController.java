package com.crimecat.backend.api.naver.controller;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.api.naver.api.NaverMapApi;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/naver")
public class NaverMapController {

      private final NaverMapApi naverMapApi;

      @GetMapping("/local-search")
      public Map localSearch (@RequestParam("query") String query, @RequestParam(value = "display", defaultValue = "10") String display){
          if(query == null || query.isBlank()) throw ErrorStatus.MISSING_REQUIRED_FIELD.asControllerException();
        int displayValue;
        try {
          displayValue = Integer.parseInt(display);
        } catch (NumberFormatException e) {
          throw ErrorStatus.INVALID_PARAMETER.asControllerException();
        }
          return naverMapApi.searchLocal(query, displayValue).block();
      }
}
