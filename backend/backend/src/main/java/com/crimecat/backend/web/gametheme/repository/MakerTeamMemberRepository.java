package com.crimecat.backend.web.gametheme.repository;

import com.crimecat.backend.web.gametheme.domain.MakerTeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MakerTeamMemberRepository extends JpaRepository<MakerTeamMember, UUID> {
    List<MakerTeamMember> findByUserIdAndIsLeader(UUID leaderId, boolean isLeader);

    Optional<MakerTeamMember> findByUserIdAndTeamId(UUID userId, UUID id);
}
