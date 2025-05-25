package com.crimecat.backend.gameHistory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileStatsResponse {
    private Long creationCount; // 제작 테마 수
    private Long postCount; // 포스트 수
    private Long crimeSceneCount; // 크라임씬 플레이 수
    private Long escapeRoomCount; // 방탈출 플레이 수
    private Long followerCount; // 팔로워 수
    private Long followingCount; // 팔로잉 수
    
    public static UserProfileStatsResponse of(
            Long creationCount,
            Long postCount,
            Long crimeSceneCount, 
            Long escapeRoomCount, 
            Long followerCount, 
            Long followingCount) {
        return UserProfileStatsResponse.builder()
                .creationCount(creationCount != null ? creationCount : 0L)
                .postCount(postCount != null ? postCount : 0L)
                .crimeSceneCount(crimeSceneCount != null ? crimeSceneCount : 0L)
                .escapeRoomCount(escapeRoomCount != null ? escapeRoomCount : 0L)
                .followerCount(followerCount != null ? followerCount : 0L)
                .followingCount(followingCount != null ? followingCount : 0L)
                .build();
    }
}