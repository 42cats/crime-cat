package com.crimecat.backend.admin.controller;

import com.crimecat.backend.admin.dto.permission.PermissionCreateRequest;
import com.crimecat.backend.admin.dto.permission.PermissionUpdateRequest;
import com.crimecat.backend.admin.dto.permission.PermissionResponse;
import com.crimecat.backend.admin.dto.permission.PermissionsListResponse;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.permission.service.PermissionService;
import com.crimecat.backend.permission.service.PermissionQueryService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.enums.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/permissions")
@RequiredArgsConstructor
public class AdminPermissionController {
    
    private final PermissionService permissionService;
    private final PermissionQueryService permissionQueryService;
    
    /**
     * 모든 권한 목록을 조회합니다. 관리자만 가능합니다.
     */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<PermissionsListResponse> getAllPermissions() {
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        List<Permission> permissions = permissionQueryService.findAll();
        List<PermissionResponse> permissionResponses = permissions.stream()
                .map(p -> new PermissionResponse(
                        p.getId().toString(),
                        p.getName(),
                        p.getPrice(),
                        p.getDuration(),
                        p.getInfo()
                ))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(new PermissionsListResponse("권한 목록을 조회했습니다.", permissionResponses));
    }
    
    /**
     * 새로운 권한을 생성합니다. 관리자만 가능합니다.
     */
    @PostMapping
    public ResponseEntity<PermissionResponse> createPermission(@Valid @RequestBody PermissionCreateRequest request) {
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        // 중복 체크
        Permission existingPermission = permissionService.findPermissionByPermissionName(request.getName());
        if (existingPermission != null) {
            throw ErrorStatus.PERMISSION_ALREADY_OWNED.asControllerException();
        }
        
        // 권한 생성
        permissionQueryService.savePermission(
                request.getName(),
                request.getPrice(),
                request.getDuration(),
                request.getInfo()
        );
        
        Permission created = permissionService.findPermissionByPermissionName(request.getName());
        
        PermissionResponse response = new PermissionResponse(
                created.getId().toString(),
                created.getName(),
                created.getPrice(),
                created.getDuration(),
                created.getInfo()
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 권한을 수정합니다. 관리자만 가능합니다.
     */
    @PatchMapping("/{permissionName}")
    public ResponseEntity<PermissionResponse> updatePermission(
            @PathVariable String permissionName,
            @Valid @RequestBody PermissionUpdateRequest request) {
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        Permission permission = permissionService.findPermissionByPermissionName(permissionName);
        if (permission == null) {
            throw ErrorStatus.RESOURCE_NOT_FOUND.asControllerException();
        }
        
        // 이름 변경 시 중복 체크
        if (request.getName() != null && !request.getName().equals(permissionName)) {
            Permission duplicateCheck = permissionService.findPermissionByPermissionName(request.getName());
            if (duplicateCheck != null) {
                throw ErrorStatus.PERMISSION_ALREADY_OWNED.asControllerException();
            }
        }
        
        // 권한 수정
        permission.modifyPermission(request.getName(), request.getPrice(), request.getDuration());
        if (request.getInfo() != null) {
            permission.setInfo(request.getInfo());
        }
        
        permissionQueryService.save(permission);
        
        PermissionResponse response = new PermissionResponse(
                permission.getId().toString(),
                permission.getName(),
                permission.getPrice(),
                permission.getDuration(),
                permission.getInfo()
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 권한을 삭제합니다. 관리자만 가능합니다.
     */
    @DeleteMapping("/{permissionName}")
    public ResponseEntity<PermissionResponse> deletePermission(@PathVariable String permissionName) {
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        Permission permission = permissionService.findPermissionByPermissionName(permissionName);
        if (permission == null) {
            throw ErrorStatus.RESOURCE_NOT_FOUND.asControllerException();
        }
        
        permissionQueryService.deletePermission(permission);
        
        PermissionResponse response = new PermissionResponse(
                permission.getId().toString(),
                permission.getName(),
                permission.getPrice(),
                permission.getDuration(),
                permission.getInfo()
        );
        response.setMessage("권한이 삭제되었습니다.");
        
        return ResponseEntity.ok(response);
    }
}
