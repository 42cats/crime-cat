package com.crimecat.backend.boardPost.repository;

import com.crimecat.backend.boardPost.domain.BoardPostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BoardPostLikeRepository extends JpaRepository<BoardPostLike, UUID> {

    List<BoardPostLike> findAllByPostId(UUID postId);

    Boolean existsByUserIdAndPostId(UUID userId, UUID postId);

    void deleteByPostIdAndUserId(UUID postId, UUID userId);
}
