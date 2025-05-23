package com.crimecat.backend.admin.controller;

import com.crimecat.backend.admin.dto.AddUserPointsRequest;
import com.crimecat.backend.admin.dto.BlockInfoResponse;
import com.crimecat.backend.admin.dto.BlockUserRequest;
import com.crimecat.backend.admin.dto.ChangeUserRoleRequest;
import com.crimecat.backend.admin.dto.SubtractUserPointsRequest;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.service.UserService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.dto.WebUserResponse;
import com.crimecat.backend.webUser.enums.UserRole;
import com.crimecat.backend.webUser.service.WebUserService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {
    
    private final WebUserService webUserService;
    private final UserService userService;
    
    /**
     * 모든 사용자 목록을 조회합니다. 관리자만 가능합니다.
     */
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
            throw ErrorStatus.INVALID_REQUEST.asException();
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
            throw ErrorStatus.INVALID_REQUEST.asException();
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
            throw ErrorStatus.INVALID_REQUEST.asException();
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
            throw ErrorStatus.INVALID_REQUEST.asException();
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
}
