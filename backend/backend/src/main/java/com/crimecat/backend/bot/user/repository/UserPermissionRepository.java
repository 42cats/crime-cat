package com.crimecat.backend.bot.user.repository;

import com.crimecat.backend.bot.user.domain.UserPermission;
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

	@Query("SELECT up FROM UserPermission up JOIN FETCH up.user WHERE up.user.snowflake = :snowflake AND up.permission.id = :permissionId")
	Optional<UserPermission> findUserPermissionByPermissionId(@Param("snowflake") String userSnowflake, @Param("permissionId") UUID permissionId);

	@Query("SELECT up FROM UserPermission up JOIN FETCH up.user WHERE up.user.snowflake = :snowflake AND up.expiredAt > :now")
	List<UserPermission> getActiveUserPermissions(@Param("snowflake") String userSnowflake, @Param("now") LocalDateTime now);

}
