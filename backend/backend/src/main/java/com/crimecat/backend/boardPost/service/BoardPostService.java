package com.crimecat.backend.boardPost.service;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.crimecat.backend.boardPost.domain.BoardPostLike;
import com.crimecat.backend.boardPost.dto.BoardPostDetailResponse;
import com.crimecat.backend.boardPost.dto.BoardPostRequest;
import com.crimecat.backend.boardPost.dto.BoardPostResponse;
import com.crimecat.backend.boardPost.dto.PostCommentRequest;
import com.crimecat.backend.boardPost.enums.BoardType;
import com.crimecat.backend.boardPost.enums.PostType;
import com.crimecat.backend.boardPost.repository.BoardPostLikeRepository;
import com.crimecat.backend.boardPost.repository.BoardPostRepository;
import com.crimecat.backend.boardPost.repository.PostCommentRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.AccessDeniedException;
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

        BoardPost boardPost = boardPostRepository.findByIdAndIsDeletedFalse(postId).orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));
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

    @Transactional
    public BoardPostDetailResponse likeBoardPost(
            UUID postId,
            WebUser user
    ) {
        BoardPost boardPost = boardPostRepository.findById(postId).orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));
        boolean isOwnPost = boardPost.getAuthorId().equals(user.getId());
        boolean isLikedByCurrentUser = false;
        if (boardPostLikeRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            boardPostLikeRepository.deleteByPostIdAndUserId(postId, user.getId());
        } else {
            BoardPostLike boardPostLike = BoardPostLike.from(boardPost, user);
            boardPostLikeRepository.save(boardPostLike);
            isLikedByCurrentUser = true;
        }

        return BoardPostDetailResponse.from(boardPost, isOwnPost, isLikedByCurrentUser);
    }

    @Transactional
    public BoardPostDetailResponse updateBoardPost(
            BoardPostRequest boardPostRequest,
            UUID postId,
            UUID userId
    ) {
        BoardPost boardPost = boardPostRepository.findById(postId).orElseThrow(() -> new EntityNotFoundException("게시글물 찾을 수 없습니다."));

        if (!boardPost.getAuthorId().equals(userId)) {
            throw new AccessDeniedException("게시글을 수정할 권한이 없습니다");
        }

        boardPost.update(boardPostRequest);
        BoardPost updatedBoardPost = boardPostRepository.save(boardPost);
        Boolean isLikedByCurrentUser = boardPostLikeRepository.existsByUserIdAndPostId(userId, postId);
        return BoardPostDetailResponse.from(updatedBoardPost, true, isLikedByCurrentUser);
    }

    @Transactional
    public void deleteBoardPost(
            UUID postId,
            UUID userId
    ) {
        BoardPost boardPost = boardPostRepository.findById(postId).orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        if (!boardPost.getAuthorId().equals(userId)) {
            throw new AccessDeniedException("게시글을 수정할 권한이 없습니다");
        }

        boardPost.delete();
        boardPostRepository.save(boardPost);
    }
}
