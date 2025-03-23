package com.crimecat.backend.permission.controller;

import com.crimecat.backend.permission.dto.SavePermissionRequestDto;
import com.crimecat.backend.permission.dto.SavePermissionResponseDto;
import com.crimecat.backend.permission.service.PermissionService;
import lombok.RequiredArgsConstructor;
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
}
