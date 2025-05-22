package com.crimecat.backend.boardPost.service;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.crimecat.backend.boardPost.dto.BoardPostDetailResponse;
import com.crimecat.backend.boardPost.dto.BoardPostResponse;
import com.crimecat.backend.boardPost.enums.BoardType;
import com.crimecat.backend.boardPost.enums.PostType;
import com.crimecat.backend.boardPost.repository.BoardPostLikeRepository;
import com.crimecat.backend.boardPost.repository.BoardPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BoardPostService {

    private final BoardPostRepository boardPostRepository;
    private final BoardPostLikeRepository boardPostLikeRepository;
    private final RedisTemplate<String, String> redisTemplate;

    @Transactional(readOnly = true)
    public Page<BoardPostResponse> getBoardPage(
            int page,
            int size,
            String kw,
            Sort sortType,
            BoardType boardType,
            PostType postType
    ) {
        Pageable pageable = PageRequest.of(page, size, sortType);
        Page<BoardPost> posts = boardPostRepository.findAllByKeywordAndTypeAndIsDeletedFalse(kw, boardType, postType, pageable);

        return posts.map(BoardPostResponse::from);
    }

    @Transactional
    public BoardPostDetailResponse getBoardPostDetail(
            UUID postId,
            UUID userId
    ) {
        // redis를 통해 30분 동안 한번만 조회수가 올라가도록 설정
        String redisKey = "views:" + postId + ":" + userId;

        Boolean exists = redisTemplate.hasKey(redisKey);
        if (!Boolean.TRUE.equals(exists)) {
            boardPostRepository.incrementViews(postId);
            redisTemplate.opsForValue().set(redisKey, String.valueOf(1), Duration.ofMinutes(30));
        }

        BoardPost boardPost = boardPostRepository.getBoardPostById(postId);
        boolean isLiked = boardPostLikeRepository.existsByUserIdAndPostId(userId, postId);
        boolean isOwnPost = boardPost.getUserId().equals(userId);


        return BoardPostDetailResponse.from(boardPost, isOwnPost, isLiked);

    }
}
