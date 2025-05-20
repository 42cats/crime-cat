package com.crimecat.backend.follow.dto;

import com.crimecat.backend.follow.domain.Follow;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowDto {
    private UUID id;
    private UUID followerId;
    private UUID followingId;
    private String followerNickname;
    private String followingNickname;
    private String followerProfileImage;
    private String followingProfileImage;
    private LocalDateTime createdAt;
    
    // Follow 엔티티에서 DTO 변환
    public static FollowDto from(Follow follow) {
        return FollowDto.builder()
                .id(follow.getId())
                .followerId(follow.getFollower().getId())
                .followingId(follow.getFollowing().getId())
                .followerNickname(follow.getFollower().getNickname())
                .followingNickname(follow.getFollowing().getNickname())
                .followerProfileImage(follow.getFollower().getProfileImagePath())
                .followingProfileImage(follow.getFollowing().getProfileImagePath())
                .createdAt(follow.getCreatedAt())
                .build();
    }
    
    // 팔로워 WebUser에서 DTO 변환 (팔로워 목록용)
    public static FollowDto fromFollower(WebUser follower) {
        return FollowDto.builder()
                .followerId(follower.getId())
                .followerNickname(follower.getNickname())
                .followerProfileImage(follower.getProfileImagePath())
                .build();
    }
    
    // 팔로잉 WebUser에서 DTO 변환 (팔로잉 목록용)
    public static FollowDto fromFollowing(WebUser following) {
        return FollowDto.builder()
                .followingId(following.getId())
                .followingNickname(following.getNickname())
                .followingProfileImage(following.getProfileImagePath())
                .build();
    }
}
