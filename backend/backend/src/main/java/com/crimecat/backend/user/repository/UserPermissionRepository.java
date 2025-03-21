package com.crimecat.backend.user.repository;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.domain.UserPermission;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, UUID> {

	@Query("SELECT up FROM UserPermission up WHERE up.user = :user AND up.permission = :permission")
	Optional<UserPermission> findUserPermissionByPermissionName(@Param("user") User user, @Param("permission") Permission permission);

	@Query("SELECT up FROM UserPermission up JOIN FETCH up.user WHERE up.user = :user AND up.expiredAt > :now")
	List<UserPermission> getActiveUserPermissions(@Param("user") User user, @Param("now") LocalDateTime now);

}
