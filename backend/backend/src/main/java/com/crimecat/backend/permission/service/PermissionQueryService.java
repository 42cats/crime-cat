package com.crimecat.backend.permission.service;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.permission.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PermissionQueryService {

	private final PermissionRepository permissionRepository;

	public Permission findPermissionByPermissionName(String permissionName) {
		return permissionRepository.findByPermissionName(permissionName).orElse(null);
	}

	public void savePermission(String name, Integer price, Integer duration) {
		permissionRepository.save(new Permission(name, price, duration));
	}

	public void deletePermission(Permission permission) {
		permissionRepository.delete(permission);
	}

	public List<Permission> findAll(){
		return permissionRepository.findAll();
	}
}
