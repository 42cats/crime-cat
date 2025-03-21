package com.crimecat.backend.permission.service;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.permission.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PermissionQueryService {

	private final PermissionRepository permissionRepository;

	public Permission findPermissionByPermissionName(String permissionName) {
		return permissionRepository.findByPermissionName(permissionName).orElse(null);
	}
}
