package com.crimecat.backend.admin.controller;

import com.crimecat.backend.admin.dto.AddUserPointsRequest;
import com.crimecat.backend.admin.dto.BlockInfoResponse;
import com.crimecat.backend.admin.dto.BlockUserRequest;
import com.crimecat.backend.admin.dto.ChangeUserRoleRequest;
import com.crimecat.backend.admin.dto.SubtractUserPointsRequest;
import com.crimecat.backend.admin.dto.permission.GrantPermissionRequest;
import com.crimecat.backend.admin.dto.permission.RevokePermissionRequest;
import com.crimecat.backend.admin.dto.permission.UserPermissionResponse;
import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.permission.service.PermissionService;
import com.crimecat.backend.user.domain.DiscordUser;
import com.crimecat.backend.user.domain.UserPermission;
import com.crimecat.backend.user.dto.UserGrantedPermissionDto;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.user.service.DiscordUserQueryService;
import com.crimecat.backend.user.service.UserPermissionQueryService;
import com.crimecat.backend.user.service.UserPermissionService;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.service.UserService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.dto.WebUserResponse;
import com.crimecat.backend.webUser.enums.UserRole;
import com.crimecat.backend.webUser.service.WebUserService;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {
    
    private final WebUserService webUserService;
    private final UserService userService;
    private final PermissionService permissionService;
    private final UserPermissionService userPermissionService;
    private final UserPermissionQueryService userPermissionQueryService;
    private final DiscordUserQueryService discordUserQueryService;
    private final UserRepository userRepository;
    private final EntityManager entityManager;
    
    /**
     * 모든 사용자 목록을 조회합니다. 관리자만 가능합니다.
     */
    @Transactional(readOnly = true)
    @GetMapping("/users")
    public ResponseEntity<Page<WebUserResponse>> getAllUsers(@PageableDefault Pageable pageable) {
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        Page<WebUserResponse> users = webUserService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }
    
    /**
     * 특정 사용자의 역할을 변경합니다. 관리자만 가능합니다.
     */
    @PostMapping("/users/change-role")
    public ResponseEntity<WebUserResponse> changeUserRole(@Valid @RequestBody ChangeUserRoleRequest request) {
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        // 현재 인증된 사용자가 본인의 역할을 변경하려는 경우 방지
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        if (currentUser.getId().equals(request.getUserId())) {
            throw ErrorStatus.INVALID_REQUEST.asControllerException();
        }
        
        WebUserResponse updatedUser = webUserService.changeUserRole(request.getUserId(), request.getNewRole());
        return ResponseEntity.ok(updatedUser);
    }
    
    /**
     * 특정 사용자에게 포인트를 지급합니다. 관리자 또는 매니저만 가능합니다.
     */
    @PostMapping("/users/add-points")
    public ResponseEntity<Integer> addUserPoints(@Valid @RequestBody AddUserPointsRequest request) {
        // 관리자 또는 매니저 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);
        
        User user = userService.getUserById(request.getUserId());
        user.addPoint(request.getAmount());
        User savedUser = userService.save(user);
        
        // TODO: 포인트 내역 저장 로직 추가 (필요시)
        
        return ResponseEntity.ok(savedUser.getPoint());
    }
    
    /**
     * 특정 사용자의 포인트를 차감합니다. 관리자 또는 매니저만 가능합니다.
     */
    @PostMapping("/users/subtract-points")
    public ResponseEntity<Integer> subtractUserPoints(@Valid @RequestBody SubtractUserPointsRequest request) {
        // 관리자 또는 매니저 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);
        
        User user = userService.getUserById(request.getUserId());
        
        try {
            user.subtractPoint(request.getAmount());
            User savedUser = userService.save(user);
            
            // TODO: 포인트 내역 저장 로직 추가 (필요시)
            
            return ResponseEntity.ok(savedUser.getPoint());
        } catch (IllegalStateException e) {
            throw ErrorStatus.INVALID_REQUEST.asControllerException();
        }
    }
    
    /**
     * 사용자를 차단합니다. 관리자만 가능합니다.
     */
    @PostMapping("/users/{userId}/block")
    public ResponseEntity<WebUserResponse> blockUser(@PathVariable UUID userId) {
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        // 현재 인증된 사용자가 본인을 차단하려는 경우 방지
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        if (currentUser.getId().equals(userId)) {
            throw ErrorStatus.INVALID_REQUEST.asControllerException();
        }
        
        WebUserResponse blockedUser = webUserService.blockUser(userId);
        return ResponseEntity.ok(blockedUser);
    }
    
    /**
     * 사용자를 차단합니다 (사유와 기간 포함). 관리자만 가능합니다.
     */
    @PostMapping("/users/block-with-reason")
    public ResponseEntity<WebUserResponse> blockUserWithReason(@Valid @RequestBody BlockUserRequest request) {
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        // 현재 인증된 사용자가 본인을 차단하려는 경우 방지
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        if (currentUser.getId().equals(request.getUserId())) {
            throw ErrorStatus.INVALID_REQUEST.asControllerException();
        }
        
        WebUserResponse blockedUser = webUserService.blockUserWithReason(request);
        return ResponseEntity.ok(blockedUser);
    }
    
    /**
     * 사용자의 차단 정보를 조회합니다.
     */
    @GetMapping("/users/{userId}/block-info")
    public ResponseEntity<BlockInfoResponse> getBlockInfo(@PathVariable UUID userId) {
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        BlockInfoResponse blockInfo = webUserService.getBlockInfo(userId);
        return ResponseEntity.ok(blockInfo);
    }
    
    /**
     * 사용자의 차단을 해제합니다. 관리자만 가능합니다.
     */
    @PostMapping("/users/{userId}/unblock")
    public ResponseEntity<WebUserResponse> unblockUser(@PathVariable UUID userId) {
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        WebUserResponse unblockedUser = webUserService.unblockUser(userId);
        return ResponseEntity.ok(unblockedUser);
    }
    
    /**
     * 현재 사용자의 차단 상태를 확인합니다 (인증 실패 시 호출).
     */
    @GetMapping("/block-status")
    public ResponseEntity<BlockInfoResponse> getCurrentUserBlockStatus() {
        try {
            WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
            BlockInfoResponse blockInfo = webUserService.getBlockInfo(currentUser.getId());
            return ResponseEntity.ok(blockInfo);
        } catch (Exception e) {
            // 인증되지 않은 사용자의 경우 차단되지 않은 상태로 반환
            return ResponseEntity.ok(BlockInfoResponse.notBlocked());
        }
    }
    
    /**
     * 사용자에게 권한을 부여합니다. 관리자만 가능합니다.
     */
    @Transactional()
    @PostMapping("/users/permissions/grant")
    public ResponseEntity<UserPermissionResponse> grantPermission(@Valid @RequestBody GrantPermissionRequest request) {
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        // 사용자 확인
        User user = userRepository.findByWebUserId(request.getUserId()).orElseThrow(ErrorStatus.USER_NOT_FOUND::asControllerException);
        if (user.getDiscordUser() == null) {
            throw ErrorStatus.USER_NOT_FOUND.asControllerException();
        }

        DiscordUser discordUser = user.getDiscordUser();
        
        // 권한 확인
        Permission permission = permissionService.findPermissionByPermissionName(request.getPermissionName());
        if (permission == null) {
            throw ErrorStatus.RESOURCE_NOT_FOUND.asControllerException();
        }
        
        // 기존 권한 확인
        UserPermission existingPermission = userPermissionService.getUserPermissionByPermissionId(
                discordUser, permission.getId());
        
        if (existingPermission != null) {
            // 이미 권한이 있는 경우 만료일 업데이트
            if (request.getExpiresAt() != null) {
                existingPermission.setExpiredAt(request.getExpiresAt());
            } else {
                existingPermission.extendPermissionPeriod(permission.getDuration());
            }
            userPermissionQueryService.save(existingPermission);
        } else {
            // 새로운 권한 부여
            UserPermission newPermission = new UserPermission(discordUser, permission);
            if (request.getExpiresAt() != null) {
                newPermission.setExpiredAt(request.getExpiresAt());
            }
            userPermissionQueryService.save(newPermission);
        }
        
        UserPermissionResponse response = new UserPermissionResponse();
        response.setPermissionId(permission.getId().toString());
        response.setPermissionName(permission.getName());
        response.setExpiredAt(request.getExpiresAt() != null ? request.getExpiresAt() : 
                LocalDateTime.now().plusDays(permission.getDuration()));
        response.setMessage("권한이 성공적으로 부여되었습니다.");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 사용자의 권한을 해제합니다. 관리자만 가능합니다.
     */
    @Transactional()
    @PostMapping("/users/permissions/revoke")
    public ResponseEntity<UserPermissionResponse> revokePermission(@Valid @RequestBody RevokePermissionRequest request) {
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        // 사용자 확인
        User user = userRepository.findByWebUserId(request.getUserId()).orElseThrow(ErrorStatus.USER_NOT_FOUND::asControllerException);
        if (user.getDiscordUser() == null) {
            throw ErrorStatus.USER_NOT_FOUND.asControllerException();
        }
        
        DiscordUser discordUser = user.getDiscordUser();
        
        // 권한 확인
        Permission permission = permissionService.findPermissionByPermissionName(request.getPermissionName());
        if (permission == null) {
            throw ErrorStatus.RESOURCE_NOT_FOUND.asControllerException();
        }
        
        // 기존 권한 확인 및 삭제
        UserPermission existingPermission = userPermissionService.getUserPermissionByPermissionId(
                discordUser, permission.getId());
        
        if (existingPermission != null) {
            userPermissionQueryService.delete(existingPermission);
            
            UserPermissionResponse response = new UserPermissionResponse();
            response.setPermissionId(permission.getId().toString());
            response.setPermissionName(permission.getName());
            response.setMessage("권한이 성공적으로 해제되었습니다.");
            
            return ResponseEntity.ok(response);
        } else {
            throw ErrorStatus.RESOURCE_NOT_FOUND.asControllerException();
        }
    }
    
    /**
     * 사용자의 모든 권한을 조회합니다. 관리자만 가능합니다.
     */
    @Transactional(readOnly = true)
    @GetMapping("/users/{webUserId}/permissions")
    public ResponseEntity<List<UserGrantedPermissionDto>> getUserPermissions(@PathVariable UUID webUserId) {
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        // 사용자 확인
        User user = userRepository.findByWebUserId(webUserId).orElseThrow(ErrorStatus.USER_NOT_FOUND::asControllerException);
        if (user.getDiscordUser() == null) {
            throw ErrorStatus.USER_NOT_FOUND.asControllerException();
        }
        
        List<UserGrantedPermissionDto> permissions = userPermissionService.getActiveUserPermissions(user.getDiscordUser())
                .stream()
                .map(UserGrantedPermissionDto::of)
                .toList();
        
        return ResponseEntity.ok(permissions);
    }
    
    /**
     * 데이터베이스의 GAME_THEMES 테이블 TYPE 컬럼 값들을 조사합니다. 관리자만 가능합니다.
     */
    @Transactional(readOnly = true)
    @GetMapping("/debug/game-themes-type-analysis")
    public ResponseEntity<Map<String, Object>> analyzeGameThemesTypeColumn() {
        // 관리자 권한 확인
        AuthenticationUtil.validateUserHasMinimumRole(UserRole.ADMIN);
        
        try {
            // TYPE 컬럼 값별 개수 조회
            Query typeCountQuery = entityManager.createNativeQuery(
                "SELECT TYPE, COUNT(*) as count FROM GAME_THEMES GROUP BY TYPE ORDER BY count DESC"
            );
            @SuppressWarnings("unchecked")
            List<Object[]> typeCountResults = typeCountQuery.getResultList();
            
            // NULL 값 개수 조회
            Query nullCountQuery = entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM GAME_THEMES WHERE TYPE IS NULL"
            );
            Long nullCount = ((Number) nullCountQuery.getSingleResult()).longValue();
            
            // 빈 문자열 개수 조회
            Query emptyStringCountQuery = entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM GAME_THEMES WHERE TYPE = ''"
            );
            Long emptyStringCount = ((Number) emptyStringCountQuery.getSingleResult()).longValue();
            
            // 전체 레코드 수 조회
            Query totalCountQuery = entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM GAME_THEMES"
            );
            Long totalCount = ((Number) totalCountQuery.getSingleResult()).longValue();
            
            // 샘플 데이터 조회 (첫 10개)
            Query sampleQuery = entityManager.createNativeQuery(
                "SELECT HEX(ID) as id, TITLE, TYPE FROM GAME_THEMES LIMIT 10"
            );
            @SuppressWarnings("unchecked")
            List<Object[]> sampleResults = sampleQuery.getResultList();
            
            // 결과 취합
            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("totalRecords", totalCount);
            result.put("nullTypeCount", nullCount);
            result.put("emptyStringTypeCount", emptyStringCount);
            
            // TYPE 값별 통계
            java.util.List<java.util.Map<String, Object>> typeStats = new java.util.ArrayList<>();
            for (Object[] row : typeCountResults) {
                java.util.Map<String, Object> stat = new java.util.HashMap<>();
                stat.put("type", row[0]);
                stat.put("count", row[1]);
                typeStats.add(stat);
            }
            result.put("typeStatistics", typeStats);
            
            // 샘플 데이터
            java.util.List<java.util.Map<String, Object>> samples = new java.util.ArrayList<>();
            for (Object[] row : sampleResults) {
                java.util.Map<String, Object> sample = new java.util.HashMap<>();
                sample.put("id", row[0]);
                sample.put("title", row[1]);
                sample.put("type", row[2]);
                samples.add(sample);
            }
            result.put("sampleData", samples);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            java.util.Map<String, Object> errorResult = new java.util.HashMap<>();
            errorResult.put("error", "데이터베이스 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.ok(errorResult);
        }
    }
}
