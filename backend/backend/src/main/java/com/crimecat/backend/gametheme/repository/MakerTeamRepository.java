package com.crimecat.backend.gametheme.repository;

import com.crimecat.backend.gametheme.domain.MakerTeam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MakerTeamRepository extends JpaRepository<MakerTeam, UUID> {
    List<MakerTeam> findByName(String name);
}
