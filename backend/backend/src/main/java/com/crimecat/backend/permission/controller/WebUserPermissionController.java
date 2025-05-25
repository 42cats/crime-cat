package com.crimecat.backend.permission.controller;

import com.crimecat.backend.permission.dto.AllPermissionsWithUserStatusResponseDto;
import com.crimecat.backend.permission.dto.PermissionExtendResponseDto;
import com.crimecat.backend.permission.dto.PermissionPurchaseResponseDto;
import com.crimecat.backend.permission.dto.PermissionPurchaseWebRequestDto;
import com.crimecat.backend.permission.service.WebUserPermissionService;
import com.crimecat.backend.user.dto.UserGrantedPermissionDto;
import com.crimecat.backend.utils.AuthenticationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/permissions")
public class WebUserPermissionController {

    private final WebUserPermissionService webUserPermissionService;

    /**
     * 사용자가 가진 권한 목록 조회
     */
    @GetMapping("/user/{user_id}")
    public ResponseEntity<List<UserGrantedPermissionDto>> getUserPermissions(
            @PathVariable("user_id") String userId) {
        // 현재 사용자 검증
        AuthenticationUtil.validateCurrentUserMatches(UUID.fromString(userId));
        
        List<UserGrantedPermissionDto> permissions = webUserPermissionService.getUserPermissions(userId);
        return ResponseEntity.ok(permissions);
    }

    /**
     * 모든 권한과 사용자의 보유 상태 조회
     */
    @GetMapping("/user/{user_id}/all")
    public ResponseEntity<AllPermissionsWithUserStatusResponseDto> getAllPermissionsWithUserStatus(
            @PathVariable("user_id") String userId) {
        // 현재 사용자 검증
        AuthenticationUtil.validateCurrentUserMatches(UUID.fromString(userId));
        
        AllPermissionsWithUserStatusResponseDto response = 
                webUserPermissionService.getAllPermissionsWithUserStatus(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 권한 구매
     */
    @PostMapping("/user/{user_id}/purchase")
    public ResponseEntity<PermissionPurchaseResponseDto> purchasePermission(
            @PathVariable("user_id") String userId,
            @RequestBody PermissionPurchaseWebRequestDto request) {
        // 현재 사용자 검증
        AuthenticationUtil.validateCurrentUserMatches(UUID.fromString(userId));
        
        PermissionPurchaseResponseDto response = 
                webUserPermissionService.purchasePermission(userId, request.getPermissionId());
        return ResponseEntity.ok(response);
    }

    /**
     * 권한 연장
     */
    @PatchMapping("/user/{user_id}/{permission_id}/extend")
    public ResponseEntity<PermissionExtendResponseDto> extendPermission(
            @PathVariable("user_id") String userId,
            @PathVariable("permission_id") String permissionId) {
        // 현재 사용자 검증
        AuthenticationUtil.validateCurrentUserMatches(UUID.fromString(userId));
        
        PermissionExtendResponseDto response = 
                webUserPermissionService.extendPermission(userId, permissionId);
        return ResponseEntity.ok(response);
    }
}
