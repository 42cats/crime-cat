package com.crimecat.backend.follow.controller;

import com.crimecat.backend.follow.dto.FollowDto;
import com.crimecat.backend.follow.service.FollowService;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/public/")
public class PublicFollowController {

  private final FollowService followService;

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
}
