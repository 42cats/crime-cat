package com.crimecat.backend.gametheme.service;

import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.gametheme.domain.MakerTeamMember;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * 테마 관련 캐시 무효화를 담당하는 서비스
 * 순환 참조를 방지하기 위해 별도 서비스로 분리
 */
@Service
@RequiredArgsConstructor
public class ThemeCacheService {
    
    private final MakerTeamService teamService;
    
    /**
     * 사용자의 테마 요약 캐시를 무효화
     * @param webUserId 사용자 ID
     */
    @CacheEvict(value = CacheType.USER_THEME_SUMMARY, key = "#webUserId")
    public void evictUserThemeSummaryCache(UUID webUserId) {
        // 캐시 무효화만 수행
    }
    
    /**
     * 팀에 속한 모든 사용자의 테마 요약 캐시를 무효화
     * @param teamId 팀 ID
     */
    public void evictTeamMembersThemeSummaryCache(UUID teamId) {
        List<MakerTeamMember> members = teamService.getTeamMembers(teamId);
        for (MakerTeamMember member : members) {
            if (member.getWebUserId() != null) {
                evictUserThemeSummaryCache(member.getWebUserId());
            }
        }
    }
}