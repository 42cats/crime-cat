package com.crimecat.backend.location.controller;

import com.crimecat.backend.location.dto.LocationMappingDto;
import com.crimecat.backend.location.dto.LocationMappingRequest;
import com.crimecat.backend.location.dto.LocationMappingResponse;
import com.crimecat.backend.location.service.LocationMappingService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.enums.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/location-mappings")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class LocationMappingAdminController {
    
    private final LocationMappingService locationMappingService;
    
    @GetMapping
    public ResponseEntity<LocationMappingResponse> getMappings(
            @PageableDefault(size = 20, sort = "keyword") Pageable pageable,
            @RequestParam(required = false) String search) {
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);
        log.info("지역 매핑 목록 조회 요청 - page: {}, size: {}, search: {}", 
                pageable.getPageNumber(), pageable.getPageSize(), search);
        return ResponseEntity.ok(locationMappingService.getMappings(pageable, search));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<LocationMappingDto> getMapping(@PathVariable UUID id) {
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);
        log.info("지역 매핑 상세 조회 요청 - id: {}", id);
        return ResponseEntity.ok(locationMappingService.getMapping(id));
    }
    
    @PostMapping
    public ResponseEntity<LocationMappingDto> createMapping(@Valid @RequestBody LocationMappingRequest request) {
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);
        log.info("지역 매핑 생성 요청 - keyword: {}", request.getKeyword());
        LocationMappingDto created = locationMappingService.createMapping(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<LocationMappingDto> updateMapping(
            @PathVariable UUID id,
            @Valid @RequestBody LocationMappingRequest request) {
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);
        log.info("지역 매핑 수정 요청 - id: {}, keyword: {}", id, request.getKeyword());
        LocationMappingDto updated = locationMappingService.updateMapping(id, request);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMapping(@PathVariable UUID id) {
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);
        log.info("지역 매핑 삭제 요청 - id: {}", id);
        locationMappingService.deleteMapping(id);
        return ResponseEntity.noContent().build();
    }
}