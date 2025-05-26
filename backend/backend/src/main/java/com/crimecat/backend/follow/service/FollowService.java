package com.crimecat.backend.follow.service;

import com.crimecat.backend.follow.domain.Follow;
import com.crimecat.backend.follow.dto.FollowDto;
import com.crimecat.backend.follow.repository.FollowRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import com.crimecat.backend.exception.ErrorStatus;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final WebUserRepository webUserRepository;

    // 팔로우하기
    @Transactional
    public FollowDto follow(UUID followerId, UUID followingId) {
        // 자기 자신을 팔로우할 수 없음
        if (followerId.equals(followingId)) {
            throw ErrorStatus.FOLLOW_SELF_NOT_ALLOWED.asServiceException();
        }
        
        // 이미 팔로우 중인지 확인
        if (followRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw ErrorStatus.FOLLOW_ALREADY_EXISTS.asServiceException();
        }
        
        // 사용자 존재 여부 확인
        WebUser follower = webUserRepository.findById(followerId)
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        WebUser following = webUserRepository.findById(followingId)
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        // 팔로우 관계 생성
        Follow follow = Follow.of(follower, following);
        Follow savedFollow = followRepository.save(follow);
        
        return FollowDto.from(savedFollow);
    }
    
    // 언팔로우하기
    @Transactional
    public void unfollow(UUID followerId, UUID followingId) {
        Follow follow = followRepository.findByFollowerIdAndFollowingId(followerId, followingId)
                .orElseThrow(ErrorStatus.FOLLOW_NOT_FOUND::asServiceException);
        
        followRepository.delete(follow);
    }
    
    // 팔로우 여부 확인
    @Transactional(readOnly = true)
    public boolean isFollowing(UUID followerId, UUID followingId) {
        return followRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
    }
    
    // 팔로워 목록 조회
    @Transactional(readOnly = true)
    public Page<FollowDto> getFollowers(UUID webUserId, Pageable pageable) {
        Page<WebUser> followers = followRepository.findFollowersByUserId(webUserId, pageable);
        return followers.map(FollowDto::fromFollower);
    }
    
    // 팔로잉 목록 조회
    @Transactional(readOnly = true)
    public Page<FollowDto> getFollowings(UUID webUserId, Pageable pageable) {
        Page<WebUser> followings = followRepository.findFollowingsByUserId(webUserId, pageable);
        return followings.map(FollowDto::fromFollowing);
    }
    
    // 팔로워 수 조회
    @Transactional(readOnly = true)
    public long getFollowerCount(UUID webUserId) {
        return followRepository.countByFollowingId(webUserId);
    }
    
    // 팔로잉 수 조회
    @Transactional(readOnly = true)
    public long getFollowingCount(UUID webUserId) {
        return followRepository.countByFollowerId(webUserId);
    }
    
    // 팔로우 ID 목록 조회 (UserPost 권한 검사용)
    @Transactional(readOnly = true)
    public List<UUID> getFollowingIds(UUID webUserId) {
        return followRepository.findFollowingIdsByUserId(webUserId);
    }
}
