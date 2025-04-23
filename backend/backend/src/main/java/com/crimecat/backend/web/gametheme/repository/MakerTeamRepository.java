package com.crimecat.backend.web.gametheme.repository;

import com.crimecat.backend.web.gametheme.domain.MakerTeam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MakerTeamRepository extends JpaRepository<MakerTeam, UUID> {
    List<MakerTeam> findByName(String name);
}
