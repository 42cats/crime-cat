package com.crimecat.backend.user.repository;

import com.crimecat.backend.user.domain.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

	@Query("SELECT u FROM User u WHERE u.snowflake = :userSnowflake")
	Optional<User> findBySnowflake(String userSnowflake);
}
