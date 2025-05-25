package com.crimecat.backend.advertisement.controller;

import com.crimecat.backend.advertisement.dto.ThemeAdvertisementResponse;
import com.crimecat.backend.advertisement.service.ThemeAdvertisementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public/theme-ads")
@RequiredArgsConstructor
public class ThemeAdvertisementPublicController {
    
    private final ThemeAdvertisementService advertisementService;
    
    @GetMapping("/active")
    public ResponseEntity<List<ThemeAdvertisementResponse>> getActiveAdvertisements() {
        return ResponseEntity.ok(advertisementService.getActiveAdvertisements());
    }
}
