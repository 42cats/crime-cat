package com.crimecat.backend.permission.service;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.permission.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PermissionQueryService {

	private final PermissionRepository permissionRepository;

	@Transactional(readOnly = true)
	@Cacheable(value = "permission:name", key = "#permissionName")
	public Permission findPermissionByPermissionName(String permissionName) {
		return permissionRepository.findByPermissionName(permissionName).orElse(null);
	}

	@Transactional
	@CacheEvict(value = {"permission:name", "permission:all"}, allEntries = true)
	public void savePermission(String name, Integer price, Integer duration, String info) {
		permissionRepository.save(new Permission(name, price, duration, info));
	}

	@Transactional
	@CacheEvict(value = {"permission:name", "permission:all"}, allEntries = true)
	public void deletePermission(Permission permission) {
		permissionRepository.delete(permission);
	}

	@Transactional(readOnly = true)
	@Cacheable(value = "permission:all")
	public List<Permission> findAll(){
		return permissionRepository.findAll();
	}
}
