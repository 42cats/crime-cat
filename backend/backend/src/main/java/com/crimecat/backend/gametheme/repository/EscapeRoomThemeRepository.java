package com.crimecat.backend.gametheme.repository;

import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EscapeRoomThemeRepository extends JpaRepository<EscapeRoomTheme, UUID> {
}