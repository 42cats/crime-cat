package com.crimecat.backend.follow.controller;

import com.crimecat.backend.follow.dto.FollowDto;
import com.crimecat.backend.follow.service.FollowService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/follows")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    // 팔로우하기
    @PostMapping("/{followingId}")
    public ResponseEntity<FollowDto> follow(@PathVariable UUID followingId) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        FollowDto followDto = followService.follow(currentUser.getId(), followingId);
        return new ResponseEntity<>(followDto, HttpStatus.CREATED);
    }

    // 언팔로우하기
    @DeleteMapping("/{followingId}")
    public ResponseEntity<Void> unfollow(@PathVariable UUID followingId) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        followService.unfollow(currentUser.getId(), followingId);
        return ResponseEntity.noContent().build();
    }

    // 팔로우 여부 확인
    @GetMapping("/{userId}/following")
    public ResponseEntity<Map<String, Boolean>> isFollowing(@PathVariable UUID userId) {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        boolean isFollowing = followService.isFollowing(currentUser.getId(), userId);
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("isFollowing", isFollowing);
        
        return ResponseEntity.ok(response);
    }

    // 팔로워 목록 조회
    @GetMapping("/{userId}/followers")
    public ResponseEntity<Page<FollowDto>> getFollowers(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<FollowDto> followers = followService.getFollowers(userId, pageable);
        
        return ResponseEntity.ok(followers);
    }

    // 팔로잉 목록 조회
    @GetMapping("/{userId}/followings")
    public ResponseEntity<Page<FollowDto>> getFollowings(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<FollowDto> followings = followService.getFollowings(userId, pageable);
        
        return ResponseEntity.ok(followings);
    }

    // 팔로워 수 조회
    @GetMapping("/{userId}/follower-count")
    public ResponseEntity<Map<String, Long>> getFollowerCount(@PathVariable UUID userId) {
        long followerCount = followService.getFollowerCount(userId);
        
        Map<String, Long> response = new HashMap<>();
        response.put("followerCount", followerCount);
        
        return ResponseEntity.ok(response);
    }

    // 팔로잉 수 조회
    @GetMapping("/{userId}/following-count")
    public ResponseEntity<Map<String, Long>> getFollowingCount(@PathVariable UUID userId) {
        long followingCount = followService.getFollowingCount(userId);
        
        Map<String, Long> response = new HashMap<>();
        response.put("followingCount", followingCount);
        
        return ResponseEntity.ok(response);
    }
    
    // 나의 팔로워/팔로잉 카운트
    @GetMapping("/my/counts")
    public ResponseEntity<Map<String, Long>> getMyFollowCounts() {
        WebUser currentUser = AuthenticationUtil.getCurrentWebUser();
        UUID userId = currentUser.getId();
        
        long followerCount = followService.getFollowerCount(userId);
        long followingCount = followService.getFollowingCount(userId);
        
        Map<String, Long> response = new HashMap<>();
        response.put("followerCount", followerCount);
        response.put("followingCount", followingCount);
        
        return ResponseEntity.ok(response);
    }
}
