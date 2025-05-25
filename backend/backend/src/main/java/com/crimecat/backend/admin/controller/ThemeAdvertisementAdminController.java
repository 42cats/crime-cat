package com.crimecat.backend.admin.controller;

import com.crimecat.backend.advertisement.dto.CreateThemeAdvertisementRequest;
import com.crimecat.backend.advertisement.dto.ThemeAdvertisementResponse;
import com.crimecat.backend.advertisement.dto.UpdateThemeAdvertisementRequest;
import com.crimecat.backend.advertisement.service.ThemeAdvertisementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/theme-ads")
@RequiredArgsConstructor
public class ThemeAdvertisementAdminController {
    
    private final ThemeAdvertisementService advertisementService;
    
    @GetMapping
    public ResponseEntity<List<ThemeAdvertisementResponse>> getAllAdvertisements() {
        return ResponseEntity.ok(advertisementService.getAllAdvertisements());
    }
    
    @PostMapping
    public ResponseEntity<ThemeAdvertisementResponse> createAdvertisement(
            @Valid @RequestBody CreateThemeAdvertisementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(advertisementService.createAdvertisement(request));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ThemeAdvertisementResponse> updateAdvertisement(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateThemeAdvertisementRequest request) {
        return ResponseEntity.ok(advertisementService.updateAdvertisement(id, request));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAdvertisement(@PathVariable UUID id) {
        advertisementService.deleteAdvertisement(id);
        return ResponseEntity.noContent().build();
    }
}
