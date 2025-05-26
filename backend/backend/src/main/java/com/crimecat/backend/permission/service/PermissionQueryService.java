package com.crimecat.backend.permission.service;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.permission.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PermissionQueryService {

	private final PermissionRepository permissionRepository;

	//@cacheable(value = "permission:name", key = "#permissionName")
	public Permission findPermissionByPermissionName(String permissionName) {
		return permissionRepository.findByPermissionName(permissionName).orElse(null);
	}

	//@cacheEvict(value = {"permission:name", "permission:all"}, allEntries = true)
	public void savePermission(String name, Integer price, Integer duration, String info) {
		permissionRepository.save(new Permission(name, price, duration, info));
	}

	//@cacheEvict(value = {"permission:name", "permission:all"}, allEntries = true)
	public void deletePermission(Permission permission) {
		permissionRepository.delete(permission);
	}

	//@cacheable(value = "permission:all")
	public List<Permission> findAll(){
		return permissionRepository.findAll();
	}
}
