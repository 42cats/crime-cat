package com.crimecat.backend.boardPost.service;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.crimecat.backend.boardPost.domain.BoardPostLike;
import com.crimecat.backend.boardPost.dto.BoardPostDetailResponse;
import com.crimecat.backend.boardPost.dto.BoardPostRequest;
import com.crimecat.backend.boardPost.dto.BoardPostResponse;
import com.crimecat.backend.boardPost.dto.BoardPostSummary;
import com.crimecat.backend.boardPost.dto.PostNavigationResponse;
import com.crimecat.backend.boardPost.enums.BoardType;
import com.crimecat.backend.boardPost.enums.PostType;
import com.crimecat.backend.boardPost.repository.BoardPostLikeRepository;
import com.crimecat.backend.boardPost.repository.BoardPostRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gametheme.service.ViewCountService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.enums.UserRole;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class BoardPostService {

    private final BoardPostRepository boardPostRepository;
    private final BoardPostLikeRepository boardPostLikeRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final WebUserRepository webUserRepository;
    private final ViewCountService viewCountService;

    /**
     * 게시글 수정/삭제 권한 확인
     * 작성자 본인이거나 MANAGER 이상 권한을 가진 사용자만 허용
     *
     * @param postAuthorId 게시글 작성자 ID
     * @param currentUserId 현재 사용자 ID
     * @return 권한이 있으면 true, 없으면 false
     */
    private boolean canModifyPost(UUID postAuthorId, UUID currentUserId) {
        // 작성자 본인인 경우
        if (postAuthorId.equals(currentUserId)) {
            return true;
        }
        
        // MANAGER 이상 권한 확인
        try {
            AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional(readOnly = true)
    // Page 객체는 Redis 직렬화가 복잡하므로 캐시하지 않음
    public Page<BoardPostResponse> getBoardPage(
            int page,
            int size,
            String kw,
            Sort sortType,
            BoardType boardType,
            PostType postType
    ) {
        Pageable pageable = PageRequest.of(page, size, sortType);
        
        // 동적 쿼리를 사용하는 방법
        Page<BoardPost> posts;
        
        // postType이 null이거나 GENERAL인 경우 postType 필터링을 하지 않음
        if (postType == null || postType == PostType.GENERAL) {
            // postType 필터링 없이 boardType만으로 조회
            posts = boardPostRepository.findAllByKeywordAndBoardTypeAndIsDeletedFalse(kw, boardType, pageable);
        } else {
            // 특정 postType이 지정된 경우에만 postType 필터링 적용
            posts = boardPostRepository.findAllByKeywordAndTypeAndIsDeletedFalse(kw, boardType, postType, pageable);
        }

        return posts.map(BoardPostResponse::from);
    }

    @Transactional
    public BoardPostDetailResponse getBoardPostDetail(
            UUID postId,
            WebUser webUser
    ) {
        UUID userId = webUser != null ? webUser.getId() : null;
        BoardPost boardPost = boardPostRepository.findByIdAndIsDeletedFalse(postId).orElseThrow(ErrorStatus.USER_POST_NOT_FOUND::asServiceException);
        
        // IP 기반 조회수 증가
        String clientIp = (String) ((ServletRequestAttributes) Objects.requireNonNull(
            RequestContextHolder.getRequestAttributes()))
            .getRequest()
            .getAttribute("clientIp");
        viewCountService.boardIncrement(boardPost, clientIp);
        if(userId == null && boardPost.getIsSecret()){
            throw ErrorStatus.USER_POST_ACCESS_DENIED.asServiceException();
        }
        if(userId == null) {
            return BoardPostDetailResponse.from(boardPost, false, false);
        }
        boolean isLiked = boardPostLikeRepository.existsByUserIdAndPostId(userId, postId);
        boolean isOwnPost = boardPost.getAuthorId().equals(userId);
        return BoardPostDetailResponse.from(boardPost, isOwnPost, isLiked);
    }

    @Transactional
    //@CacheEvict(value = "board:post:list", allEntries = true)
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
            boardPost.dislike();
        } else {
            BoardPostLike boardPostLike = BoardPostLike.from(boardPost, user);
            boardPostLikeRepository.save(boardPostLike);
            boardPost.like();
            isLikedByCurrentUser = true;
        }

        return BoardPostDetailResponse.from(boardPost, isOwnPost, isLikedByCurrentUser);
    }

    @Transactional
    //@CacheEvict(value = "board:post:list", allEntries = true)
    public BoardPostDetailResponse updateBoardPost(
            BoardPostRequest boardPostRequest,
            UUID postId,
            UUID userId
    ) {
        BoardPost boardPost = boardPostRepository.findById(postId).orElseThrow(() -> new EntityNotFoundException("게시글물 찾을 수 없습니다."));

        if (!canModifyPost(boardPost.getAuthorId(), userId)) {
            throw new AccessDeniedException("게시글을 수정할 권한이 없습니다");
        }

        boardPost.update(boardPostRequest);
        BoardPost updatedBoardPost = boardPostRepository.save(boardPost);
        Boolean isLikedByCurrentUser = boardPostLikeRepository.existsByUserIdAndPostId(userId, postId);
        return BoardPostDetailResponse.from(updatedBoardPost, true, isLikedByCurrentUser);
    }

    @Transactional
    //@CacheEvict(value = "board:post:list", allEntries = true)
    public void deleteBoardPost(
            UUID postId,
            UUID userId
    ) {
        BoardPost boardPost = boardPostRepository.findById(postId).orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        if (!canModifyPost(boardPost.getAuthorId(), userId)) {
            throw new AccessDeniedException("게시글을 삭제할 권한이 없습니다");
        }

        boardPost.delete();
        boardPostRepository.save(boardPost);
    }

    @Transactional(readOnly = true)
    public PostNavigationResponse getPostNavigation(UUID postId, BoardType boardType) {
        // 현재 게시글 조회
        BoardPost currentPost = boardPostRepository.findByIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        // 현재 게시글이 지정된 boardType과 다르면 예외 발생
        if (!currentPost.getBoardType().equals(boardType)) {
            throw new IllegalArgumentException("잘못된 게시판 유형입니다.");
        }

        // 이전글 조회 (첫 번째 결과만 가져오기)
        java.util.List<BoardPost> previousPosts = boardPostRepository.findPreviousPost(
                boardType, 
                currentPost.getCreatedAt(), 
                PageRequest.of(0, 1)
        );
        BoardPost previousPost = previousPosts.isEmpty() ? null : previousPosts.get(0);

        // 다음글 조회 (첫 번째 결과만 가져오기)
        java.util.List<BoardPost> nextPosts = boardPostRepository.findNextPost(
                boardType, 
                currentPost.getCreatedAt(), 
                PageRequest.of(0, 1)
        );
        BoardPost nextPost = nextPosts.isEmpty() ? null : nextPosts.get(0);

        return PostNavigationResponse.builder()
                .currentPost(BoardPostSummary.from(currentPost))
                .previousPost(previousPost != null ? BoardPostSummary.from(previousPost) : null)
                .nextPost(nextPost != null ? BoardPostSummary.from(nextPost) : null)
                .build();
    }
}
