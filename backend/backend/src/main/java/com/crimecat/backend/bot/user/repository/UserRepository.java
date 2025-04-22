package com.crimecat.backend.bot.user.repository;

import com.crimecat.backend.bot.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
}
