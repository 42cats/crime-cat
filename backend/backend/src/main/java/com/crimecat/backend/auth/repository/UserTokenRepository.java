package com.crimecat.backend.auth.repository;

import com.crimecat.backend.auth.domain.UserToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserTokenRepository extends JpaRepository<UserToken, UUID> {

}
