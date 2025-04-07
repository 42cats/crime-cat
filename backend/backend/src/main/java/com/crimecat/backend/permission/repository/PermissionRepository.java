package com.crimecat.backend.permission.repository;

import com.crimecat.backend.permission.domain.Permission;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {

	@Query("SELECT p FROM Permission p WHERE p.name = :permissionName")
	Optional<Permission> findByPermissionName(@Param("permissionName") String permissionName);

	@Override
	List<Permission> findAll();
}
