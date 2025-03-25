package com.crimecat.backend.permission.controller;

import com.crimecat.backend.permission.dto.DeletePermissionResponseDto;
import com.crimecat.backend.permission.dto.ModifyPermissionRequestDto;
import com.crimecat.backend.permission.dto.SavePermissionRequestDto;
import com.crimecat.backend.permission.dto.SavePermissionResponseDto;
import com.crimecat.backend.permission.dto.ModifyPermissionResponseDto;
import com.crimecat.backend.permission.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
	public ModifyPermissionResponseDto patchPermission(
			@PathVariable("permission_name") String beforePermissionName,
			@RequestBody ModifyPermissionRequestDto modifyPermissionRequestDto) {
		return permissionService.patchPermission(
				beforePermissionName,
				modifyPermissionRequestDto.getName(),
				modifyPermissionRequestDto.getPrice(),
				modifyPermissionRequestDto.getDuration());
	}
}
