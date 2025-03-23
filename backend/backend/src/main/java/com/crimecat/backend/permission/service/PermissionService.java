package com.crimecat.backend.permission.service;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.permission.dto.DeletePermissionResponseDto;
import com.crimecat.backend.permission.dto.SavePermissionResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PermissionService {

	private final PermissionQueryService permissionQueryService;

	@Transactional(readOnly = true)
	public Permission findPermissionByPermissionName(String permissionName) {
		return permissionQueryService.findPermissionByPermissionName(permissionName);
	}

	// TODO : 권한 이미 존재할 때 덮어쓰기? 튕기기? 일단 튕기기로 처리함
	@Transactional
	public SavePermissionResponseDto savePermission(String name, Integer price, Integer duration) {
		Permission permissionByPermissionName = permissionQueryService.findPermissionByPermissionName(name);

		if (permissionByPermissionName != null) {
			return new SavePermissionResponseDto("Failed to save");
		}

		permissionQueryService.savePermission(name, price, duration);
	}

	public DeletePermissionResponseDto deletePermissionByName(String name) {
		Permission permission = permissionQueryService.findPermissionByPermissionName(name);

		if (permission == null) {
			return new DeletePermissionResponseDto("permission not found");
		}

		permissionQueryService.deletePermission(permission);
		return new DeletePermissionResponseDto("permission deleted");
	}
}
