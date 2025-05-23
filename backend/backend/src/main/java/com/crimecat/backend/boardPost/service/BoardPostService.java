package com.crimecat.backend.boardPost.service;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.crimecat.backend.boardPost.dto.BoardPostDetailResponse;
import com.crimecat.backend.boardPost.dto.BoardPostRequest;
import com.crimecat.backend.boardPost.dto.BoardPostResponse;
import com.crimecat.backend.boardPost.enums.BoardType;
import com.crimecat.backend.boardPost.enums.PostType;
import com.crimecat.backend.boardPost.repository.BoardPostLikeRepository;
import com.crimecat.backend.boardPost.repository.BoardPostRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import jakarta.persistence.EntityNotFoundException;
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
    private final WebUserRepository webUserRepository;

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
        boolean isOwnPost = boardPost.getAuthorId().equals(userId);
        return BoardPostDetailResponse.from(boardPost, isOwnPost, isLiked);
    }

    @Transactional
    public BoardPostDetailResponse createBoardPost(
            BoardPostRequest boardPostRequest,
            UUID userId
    ) {
        WebUser author = webUserRepository.findById(userId).orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        BoardPost boardPost = BoardPost.from(boardPostRequest, author);

        BoardPost savedBoardPost = boardPostRepository.save(boardPost);
        return BoardPostDetailResponse.from(savedBoardPost, true, false);
    }
}
