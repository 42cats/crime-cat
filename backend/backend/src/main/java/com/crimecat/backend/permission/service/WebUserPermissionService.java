package com.crimecat.backend.permission.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.permission.dto.AllPermissionsWithUserStatusResponseDto;
import com.crimecat.backend.permission.dto.PermissionExtendResponseDto;
import com.crimecat.backend.permission.dto.PermissionWithStatusDto;
import com.crimecat.backend.permission.repository.PermissionRepository;
import com.crimecat.backend.user.domain.UserPermission;
import com.crimecat.backend.user.dto.UserGrantedPermissionDto;
import com.crimecat.backend.user.dto.UserPermissionPurchaseResponseDto;
import com.crimecat.backend.user.dto.UserPermissionPurchaseSuccessResponseDto;
import com.crimecat.backend.user.service.UserPermissionQueryService;
import com.crimecat.backend.user.service.UserPermissionService;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebUserPermissionService {
    
    private final PermissionRepository permissionRepository;
    private final WebUserRepository webUserRepository;
    private final UserPermissionService userPermissionService;
    private final UserPermissionQueryService userPermissionQueryService;
    
    /**
     * 모든 권한과 사용자의 보유 상태 조회
     */
    @Transactional(readOnly = true)
    public AllPermissionsWithUserStatusResponseDto getAllPermissionsWithUserStatus(String userId) {
        // 웹 사용자 조회
        WebUser webUser = webUserRepository.findById(UUID.fromString(userId))
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        // 모든 권한 조회
        List<Permission> allPermissions = permissionRepository.findAll();
        
        // 사용자가 보유한 권한 조회
        List<UserPermission> userPermissions = userPermissionQueryService
                .getActiveUserPermissions(webUser.getDiscordUser());
        
        // 권한별 보유 상태 맵 생성
        Map<UUID, UserPermission> userPermissionMap = userPermissions.stream()
                .collect(Collectors.toMap(
                    up -> up.getPermission().getId(),
                    up -> up
                ));
        
        // 권한 상태 DTO 생성
        List<PermissionWithStatusDto> permissionWithStatusList = allPermissions.stream()
                .map(permission -> {
                    UserPermission userPermission = userPermissionMap.get(permission.getId());
                    boolean isOwned = userPermission != null;
                    boolean canExtend = isOwned && userPermission.getExpiredAt().isAfter(LocalDateTime.now());
                    
                    return PermissionWithStatusDto.builder()
                            .permissionId(permission.getId().toString())
                            .permissionName(permission.getName())
                            .price(permission.getPrice())
                            .duration(permission.getDuration())
                            .info(permission.getInfo())
                            .isOwned(isOwned)
                            .expiredDate(isOwned ? userPermission.getExpiredAt().toString() : null)
                            .canExtend(canExtend)
                            .build();
                })
                .collect(Collectors.toList());
        
        return new AllPermissionsWithUserStatusResponseDto(
                permissionWithStatusList,
                "권한 목록 조회 성공"
        );
    }
    
    /**
     * 권한 구매
     */
    @Transactional
    public UserPermissionPurchaseResponseDto purchasePermission(String userId, String permissionId) {
        // 웹 사용자 조회
        WebUser webUser = webUserRepository.findById(UUID.fromString(userId))
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        // 권한 조회
        Permission permission = permissionRepository.findById(UUID.fromString(permissionId))
                .orElseThrow(ErrorStatus.PERMISSION_NOT_FOUND::asServiceException);
        
        // 이미 권한을 가지고 있는지 확인
        UserPermission existingPermission = userPermissionService
                .getUserPermissionByPermissionId(webUser.getDiscordUser(), UUID.fromString(permissionId));
        
        if (existingPermission != null && existingPermission.getExpiredAt().isAfter(LocalDateTime.now())) {
            return UserPermissionPurchaseResponseDto.builder()
                    .success(false)
                    .message("이미 보유한 권한입니다.")
                    .build();
        }
        
        // 포인트 확인
        if (webUser.getDiscordUser().getPoint() < permission.getPrice()) {
            return UserPermissionPurchaseResponseDto.builder()
                    .success(false)
                    .message("포인트가 부족합니다.")
                    .build();
        }
        
        // 권한 구매 처리
        userPermissionService.purchasePermission(webUser.getDiscordUser(), permission);
        
        return UserPermissionPurchaseResponseDto.builder()
                .success(true)
                .message("권한 구매 성공")
                .data(UserPermissionPurchaseSuccessResponseDto.builder()
                    .point(webUser.getDiscordUser().getPoint() - permission.getPrice())
                    .build())
                .build();
    }
    
    /**
     * 권한 연장
     */
    @Transactional
    public PermissionExtendResponseDto extendPermission(String userId, String permissionId) {
        // 웹 사용자 조회
        WebUser webUser = webUserRepository.findById(UUID.fromString(userId))
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        // 권한 조회
        Permission permission = permissionRepository.findById(UUID.fromString(permissionId))
                .orElseThrow(ErrorStatus.PERMISSION_NOT_FOUND::asServiceException);
        
        // 사용자의 해당 권한 조회
        UserPermission userPermission = userPermissionService
                .getUserPermissionByPermissionId(webUser.getDiscordUser(), UUID.fromString(permissionId));
        
        if (userPermission == null) {
            throw ErrorStatus.PERMISSION_NOT_OWNED.asServiceException();
        }
        
        // 포인트 확인
        if (webUser.getDiscordUser().getPoint() < permission.getPrice()) {
            throw ErrorStatus.INSUFFICIENT_POINT.asServiceException();
        }
        
        // 권한 연장 (기존 만료일에서 기간 추가)
        LocalDateTime newExpiredDate = userPermission.getExpiredAt().plusDays(permission.getDuration());
        userPermissionQueryService.extendPermission(userPermission, newExpiredDate);
        
        // 포인트 차감
        webUser.getDiscordUser().setPoint(webUser.getDiscordUser().getPoint() - permission.getPrice());
        
        return new PermissionExtendResponseDto(
                "권한 연장 성공",
                newExpiredDate.toString()
        );
    }
    
    /**
     * 사용자 권한 목록 조회 (WebUserController에서 이동)
     */
    @Transactional(readOnly = true)
    public List<UserGrantedPermissionDto> getUserPermissions(String userId) {
        WebUser webUser = webUserRepository.findById(UUID.fromString(userId))
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        return userPermissionQueryService.getActiveUserPermissions(webUser.getDiscordUser())
                .stream()
                .map(up -> UserGrantedPermissionDto.builder()
                        .permissionId(up.getPermission().getId().toString())
                        .permissionName(up.getPermission().getName())
                        .info(up.getPermission().getInfo())
                        .expiredDate(up.getExpiredAt())
                        .build())
                .collect(Collectors.toList());
    }
}
