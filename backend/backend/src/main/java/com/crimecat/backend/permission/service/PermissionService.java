package com.crimecat.backend.permission.service;

import com.crimecat.backend.permission.domain.Permission;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PermissionService {

	private final PermissionQueryService permissionQueryService;

	public Permission findPermissionByPermissionName(String permissionName) {
		return permissionQueryService.findPermissionByPermissionName(permissionName);
	}
}
