package com.crimecat.backend.gametheme.repository;

import com.crimecat.backend.gametheme.domain.MakerTeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MakerTeamMemberRepository extends JpaRepository<MakerTeamMember, UUID> {
    List<MakerTeamMember> findByWebUserIdAndIsLeader(UUID webUserId, boolean isLeader);

    Optional<MakerTeamMember> findByWebUserIdAndTeamId(UUID webUserId, UUID teamId);

    List<MakerTeamMember> findByWebUserId(UUID webUserId);
}
