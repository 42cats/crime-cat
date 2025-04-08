package com.crimecat.backend.permission.controller;

import com.crimecat.backend.permission.dto.*;
import com.crimecat.backend.permission.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("v1/bot/permissions")
public class PermissionController {

	private final PermissionService permissionService;

	/**
	 * 새로운 권한 생성
	 * @param savePermissionRequestDto
	 * @return
	 */
	@PostMapping("")
	public SavePermissionResponseDto savePermission(
			@RequestBody SavePermissionRequestDto savePermissionRequestDto) {
		return permissionService.savePermission(
				savePermissionRequestDto.getName(),
				savePermissionRequestDto.getPrice(),
				savePermissionRequestDto.getDuration());
	}
	/**
	 * 권한 목록 조회
	 * @return
	 */
	@GetMapping("")
	public PermissionsResponseDto getPermissions() {
		return permissionService.getAllPermissions();
	}
	/**
	 * 특정 권한 삭제
	 *
	 * @return
	 */
	@DeleteMapping("/{permission_name}")
	public DeletePermissionResponseDto deletePermission(
			@PathVariable("permission_name") String permissionName) {
		return permissionService.deletePermissionByName(permissionName);
	}

	/**
	 * 권한 수정
	 * @param beforePermissionName
	 * @param modifyPermissionRequestDto
	 * @return
	 */
	@PatchMapping("/{permission_name}")
	public ModifyPermissionResponseDto modifyPermission(
			@PathVariable("permission_name") String beforePermissionName,
			@RequestBody ModifyPermissionRequestDto modifyPermissionRequestDto) {
		return permissionService.modifyPermission(
				beforePermissionName,
				modifyPermissionRequestDto.getName(),
				modifyPermissionRequestDto.getPrice(),
				modifyPermissionRequestDto.getDuration());
	}
}
