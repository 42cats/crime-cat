package com.crimecat.backend.gameHistory.service;

import com.crimecat.backend.follow.repository.FollowRepository;
import com.crimecat.backend.gameHistory.dto.UserProfileStatsResponse;
import com.crimecat.backend.gameHistory.repository.EscapeRoomHistoryRepository;
import com.crimecat.backend.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.gametheme.repository.GameThemeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserProfileStatsService {
    
    private final GameThemeRepository gameThemeRepository;
    private final GameHistoryRepository gameHistoryRepository;
    private final EscapeRoomHistoryRepository escapeRoomHistoryRepository;
    private final FollowRepository followRepository;
    
    /**
     * 특정 사용자의 프로필 통계 정보를 한 번에 조회
     */
    public UserProfileStatsResponse getUserProfileStats(String userId) {
        try {
            UUID userUuid = UUID.fromString(userId);
            
            // 병렬로 모든 카운트 조회
            Long creationCount = gameThemeRepository.countByMakerTeamMember_WebUserId(userUuid);
            Long crimeSceneCount = gameHistoryRepository.countByUser_WebUser_Id(userUuid);
            Long escapeRoomCount = escapeRoomHistoryRepository.countByWebUserIdAndDeletedAtIsNull(userUuid);
            Long followerCount = followRepository.countByFollowingId(userUuid);
            Long followingCount = followRepository.countByFollowerId(userUuid);
            
            log.info("사용자 프로필 통계 조회 완료 - userId: {}, creation: {}, crimeScene: {}, escapeRoom: {}, follower: {}, following: {}", 
                    userId, creationCount, crimeSceneCount, escapeRoomCount, followerCount, followingCount);
            
            return UserProfileStatsResponse.of(
                    creationCount,
                    crimeSceneCount,
                    escapeRoomCount,
                    followerCount,
                    followingCount
            );
        } catch (IllegalArgumentException e) {
            log.warn("잘못된 사용자 ID 형식 - userId: {}", userId);
            return UserProfileStatsResponse.of(0L, 0L, 0L, 0L, 0L);
        } catch (Exception e) {
            log.error("사용자 프로필 통계 조회 실패 - userId: {}", userId, e);
            return UserProfileStatsResponse.of(0L, 0L, 0L, 0L, 0L);
        }
    }
}