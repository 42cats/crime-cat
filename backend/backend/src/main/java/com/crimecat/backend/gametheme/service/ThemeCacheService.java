package com.crimecat.backend.gametheme.service;

import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.gametheme.domain.MakerTeam;
import com.crimecat.backend.gametheme.domain.MakerTeamMember;
import com.crimecat.backend.gametheme.repository.MakerTeamRepository;
import com.crimecat.backend.exception.ErrorStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * 테마 관련 캐시 무효화를 담당하는 서비스
 * 순환 참조를 방지하기 위해 별도 서비스로 분리
 */
@Service
@RequiredArgsConstructor
public class ThemeCacheService {
    
    private final MakerTeamRepository teamRepository;
    
    /**
     * 사용자의 테마 요약 캐시를 무효화
     * @param webUserId 사용자 ID
     */
    @CacheEvict(value = CacheType.USER_THEME_SUMMARY, key = "#webUserId", cacheManager = "redisCacheManager")
    public void evictUserThemeSummaryCache(UUID webUserId) {
        // 캐시 무효화만 수행
    }
    
    /**
     * 팀에 속한 모든 사용자의 테마 요약 캐시를 무효화
     * @param teamId 팀 ID
     */
    @Transactional(readOnly = true)
    public void evictTeamMembersThemeSummaryCache(UUID teamId) {
        MakerTeam team = teamRepository.findByIdWithMembers(teamId)
                .orElseThrow(ErrorStatus.TEAM_NOT_FOUND::asServiceException);
        
        List<MakerTeamMember> members = team.getMembers();
        for (MakerTeamMember member : members) {
            if (member.getWebUserId() != null) {
                evictUserThemeSummaryCache(member.getWebUserId());
            }
        }
    }
}