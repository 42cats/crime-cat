package com.crimecat.backend.follow.repository;

import com.crimecat.backend.follow.domain.Follow;
import com.crimecat.backend.webUser.domain.WebUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FollowRepository extends JpaRepository<Follow, UUID> {

    // 특정 사용자가 다른 사용자를 팔로우하고 있는지 확인
    boolean existsByFollowerIdAndFollowingId(UUID followerId, UUID followingId);
    
    // 특정 사용자가 팔로우하고 있는 사용자 목록 조회
    @Query("SELECT DISTINCT f.following FROM Follow f " +
           "WHERE f.follower.id = :webUserId")
    List<WebUser> findFollowingsByUserId(@Param("webUserId") UUID webUserId);
    
    // 특정 사용자를 팔로우하고 있는 사용자 목록 조회
    @Query("SELECT DISTINCT f.follower FROM Follow f " +
           "WHERE f.following.id = :webUserId")
    List<WebUser> findFollowersByUserId(@Param("webUserId") UUID webUserId);
    
    // 특정 사용자가 팔로우하고 있는 사용자 목록 페이징 조회
    @Query(value = "SELECT DISTINCT f.following FROM Follow f " +
           "WHERE f.follower.id = :webUserId",
           countQuery = "SELECT COUNT(DISTINCT f.following) FROM Follow f WHERE f.follower.id = :webUserId")
    Page<WebUser> findFollowingsByUserId(@Param("webUserId") UUID webUserId, Pageable pageable);
    
    // 특정 사용자를 팔로우하고 있는 사용자 목록 페이징 조회
    @Query(value = "SELECT DISTINCT f.follower FROM Follow f " +
           "WHERE f.following.id = :webUserId",
           countQuery = "SELECT COUNT(DISTINCT f.follower) FROM Follow f WHERE f.following.id = :webUserId")
    Page<WebUser> findFollowersByUserId(@Param("webUserId") UUID webUserId, Pageable pageable);
    
    // 특정 팔로우 관계 조회
    @Query("SELECT f FROM Follow f " +
           "WHERE f.follower.id = :followerId AND f.following.id = :followingId")
    Optional<Follow> findByFollowerIdAndFollowingId(@Param("followerId") UUID followerId, @Param("followingId") UUID followingId);
    
    // 특정 사용자가 팔로우하고 있는 사용자 수 조회
    long countByFollowerId(UUID followerId);
    
    // 특정 사용자를 팔로우하고 있는 사용자 수 조회
    long countByFollowingId(UUID followingId);
    
    // 특정 사용자가 팔로우 관계를 맺고 있는 사용자 ID 목록 조회 (쿼리 최적화용)
    @Query("SELECT f.following.id FROM Follow f WHERE f.follower.id = :webUserId")
    List<UUID> findFollowingIdsByUserId(@Param("webUserId") UUID webUserId);
}
