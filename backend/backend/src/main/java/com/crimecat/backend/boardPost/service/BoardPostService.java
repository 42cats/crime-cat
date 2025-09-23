package com.crimecat.backend.boardPost.service;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.crimecat.backend.boardPost.domain.BoardPostLike;
import com.crimecat.backend.boardPost.dto.BoardPostDetailResponse;
import com.crimecat.backend.boardPost.dto.BoardPostRequest;
import com.crimecat.backend.boardPost.dto.BoardPostResponse;
import com.crimecat.backend.boardPost.dto.BoardPostSummary;
import com.crimecat.backend.boardPost.dto.PostNavigationResponse;
import com.crimecat.backend.boardPost.entity.BoardPostAttachment;
import com.crimecat.backend.boardPost.enums.BoardType;
import com.crimecat.backend.boardPost.enums.PostType;
import com.crimecat.backend.boardPost.repository.BoardPostLikeRepository;
import com.crimecat.backend.boardPost.repository.BoardPostRepository;
import com.crimecat.backend.config.CacheInvalidationUtil;
import com.crimecat.backend.config.CacheNames;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gametheme.service.ViewCountService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.enums.UserRole;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.cache.annotation.Cacheable;
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
    private final BoardPostAttachmentService boardPostAttachmentService;
    private final AudioAttachmentService audioAttachmentService;
    private final CacheInvalidationUtil cacheInvalidationUtil;

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
            PostType postType,
            UUID currentUserId
    ) {
        Pageable pageable = PageRequest.of(page, size, sortType);
        
        // 동적 쿼리를 사용하는 방법
        Page<BoardPost> posts;
        long totalCount;
        
        // postType이 null이거나 GENERAL인 경우 postType 필터링을 하지 않음
        if (postType == null || postType == PostType.GENERAL) {
            // 별도 카운트 쿼리로 정확한 총 개수 조회
            totalCount = boardPostRepository.countByKeywordAndBoardTypeAndIsDeletedFalse(kw, boardType);
            
            // 데이터 조회
            posts = boardPostRepository.findAllByKeywordAndBoardTypeAndIsDeletedFalse(kw, boardType, pageable);
            
            // 정확한 totalCount로 Page 객체 재생성
            List<BoardPostResponse> content = posts.getContent().stream()
                    .map(post -> BoardPostResponse.from(post, currentUserId))
                    .toList();
            
            return new org.springframework.data.domain.PageImpl<>(content, pageable, totalCount);
        } else {
            // 별도 카운트 쿼리로 정확한 총 개수 조회
            totalCount = boardPostRepository.countByKeywordAndTypeAndIsDeletedFalse(kw, boardType, postType);
            
            // 데이터 조회
            posts = boardPostRepository.findAllByKeywordAndTypeAndIsDeletedFalse(kw, boardType, postType, pageable);
            
            // 정확한 totalCount로 Page 객체 재생성
            List<BoardPostResponse> content = posts.getContent().stream()
                    .map(post -> BoardPostResponse.from(post, currentUserId))
                    .toList();
            
            return new org.springframework.data.domain.PageImpl<>(content, pageable, totalCount);
        }
    }

    @Transactional
    @Cacheable(value = CacheNames.BOARD_POST_DETAIL,
               key = "#postId + '_' + (#webUser != null ? #webUser.id : 'anonymous')")
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
        if(webUser.getRole() == UserRole.ADMIN || webUser.getRole() == UserRole.MANAGER)
            isOwnPost = true;
        return BoardPostDetailResponse.from(boardPost, isOwnPost, isLiked);
    }

    @Transactional
    public BoardPostDetailResponse createBoardPost(
            BoardPostRequest boardPostRequest,
            UUID userId
    ) {
        WebUser author = webUserRepository.findById(userId).orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        // NOTICE 유형 권한 체크
        if (PostType.NOTICE.equals(boardPostRequest.getPostType())) {
            try {
                AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);
            } catch (AccessDeniedException e) {
                throw new AccessDeniedException("공지 게시글은 관리자 및 매니저만 작성할 수 있습니다.");
            }
        }
        
        BoardPost boardPost = BoardPost.from(boardPostRequest, author);
        BoardPost savedBoardPost = boardPostRepository.save(boardPost);

        // 1. 임시 파일을 정식 파일로 변환하고, ID 매핑 정보를 받음
        Map<String, String> tempIdToStoredFilenameMap = boardPostAttachmentService.convertTempAttachmentsToPost(boardPostRequest.getTempAudioIds(), savedBoardPost);

        // 2. 본문의 임시 URL을 영구 URL로 교체
        String finalContent = replaceTempUrlsWithPermanentUrls(boardPostRequest.getContent(), tempIdToStoredFilenameMap);
        savedBoardPost.updateContent(finalContent);

        BoardPost finalBoardPost = boardPostRepository.save(savedBoardPost);

        // 새 게시글 생성 시 네비게이션 캐시 무효화 (순서 변경)
        cacheInvalidationUtil.evictAllEntries(CacheNames.POST_NAVIGATION);

        return BoardPostDetailResponse.from(finalBoardPost, true, false);
    }

    private String replaceTempUrlsWithPermanentUrls(String content, Map<String, String> tempIdToStoredFilenameMap) {
        if (content == null || tempIdToStoredFilenameMap == null || tempIdToStoredFilenameMap.isEmpty()) {
            return content;
        }
        for (Map.Entry<String, String> entry : tempIdToStoredFilenameMap.entrySet()) {
            String tempId = entry.getKey();
            String permanentFilename = entry.getValue();
            
            // 다양한 형태의 임시 URL 패턴들 처리
            String frontendTempUrl = "/board/audio/stream/" + tempId;
            String backendTempUrl = "/api/v1/board/audio/stream/" + tempId;
            
            // 상대 경로로 영구 URL 생성 (axios baseURL과 중복 방지)
            String permanentUrl = "/board/audio/stream/" + permanentFilename;
            
            // 모든 형태의 임시 URL을 상대 경로 영구 URL로 교체
            content = content.replace(frontendTempUrl, permanentUrl);
            content = content.replace(backendTempUrl, permanentUrl);
        }
        return content;
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

        // 좋아요 상태 변경 시 해당 사용자의 게시글 상세 캐시만 무효화
        cacheInvalidationUtil.evictPostLikeCache(postId, user.getId());

        return BoardPostDetailResponse.from(boardPost, isOwnPost, isLikedByCurrentUser);
    }

    @Transactional
    public BoardPostDetailResponse updateBoardPost(
            BoardPostRequest boardPostRequest,
            UUID postId,
            UUID userId
    ) {
        BoardPost boardPost = boardPostRepository.findById(postId).orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        if (!canModifyPost(boardPost.getAuthorId(), userId)) {
            throw new AccessDeniedException("게시글을 수정할 권한이 없습니다");
        }

        // NOTICE 유형 권한 체크
        if (PostType.NOTICE.equals(boardPostRequest.getPostType())) {
            try {
                AuthenticationUtil.validateUserHasMinimumRole(UserRole.MANAGER);
            } catch (AccessDeniedException e) {
                throw new AccessDeniedException("공지 게시글은 관리자 및 매니저만 작성할 수 있습니다.");
            }
        }

        // 1. 기존 첨부파일 목록 조회
        List<BoardPostAttachment> oldAttachments = boardPostAttachmentService.getAttachmentsByBoardPost(boardPost);

        // 2. content를 제외한 필드들만 먼저 업데이트
        boardPost.updateWithoutContent(boardPostRequest);

        // 3. content 처리를 위한 준비
        String finalContent = boardPostRequest.getContent();
        
        // 4. 새로운 임시 첨부파일이 있다면 정식으로 변환 및 URL 교체
        if (boardPostRequest.getTempAudioIds() != null && !boardPostRequest.getTempAudioIds().isEmpty()) {
            Map<String, String> tempIdToStoredFilenameMap = boardPostAttachmentService.convertTempAttachmentsToPost(boardPostRequest.getTempAudioIds(), boardPost);
            finalContent = replaceTempUrlsWithPermanentUrls(finalContent, tempIdToStoredFilenameMap);
        }

        // 5. content가 실제로 변경된 경우만 업데이트
        boardPost.updateContent(finalContent);

        // 6. 본문에서 제거된 오디오 파일(고아 파일) 삭제
        boardPostAttachmentService.cleanupOrphanedAttachments(boardPost, finalContent);

        BoardPost updatedBoardPost = boardPostRepository.save(boardPost);

        // 게시글 수정 시 해당 게시글과 관련된 모든 캐시 무효화
        cacheInvalidationUtil.evictPostRelatedCaches(postId);

        Boolean isLikedByCurrentUser = boardPostLikeRepository.existsByUserIdAndPostId(userId, postId);
        return BoardPostDetailResponse.from(updatedBoardPost, true, isLikedByCurrentUser);
    }

    @Transactional
    public void deleteBoardPost(
            UUID postId,
            UUID userId
    ) {
        BoardPost boardPost = boardPostRepository.findById(postId).orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        if (!canModifyPost(boardPost.getAuthorId(), userId)) {
            throw new AccessDeniedException("게시글을 삭제할 권한이 없습니다");
        }

        // 1. 연관된 첨부파일 먼저 삭제
        boardPostAttachmentService.deleteAttachmentsByBoardPost(boardPost);

        // 2. 게시글 소프트 삭제
        boardPost.delete();
        boardPostRepository.save(boardPost);

        // 게시글 삭제 시 관련된 모든 캐시 무효화
        cacheInvalidationUtil.evictPostRelatedCaches(postId);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.POST_NAVIGATION,
               key = "#postId + '_' + #boardType")
    public PostNavigationResponse getPostNavigation(UUID postId, BoardType boardType) {
        // 현재 게시글 조회
        BoardPost currentPost = boardPostRepository.findByIdAndIsDeletedFalse(postId).orElseThrow(ErrorStatus.RESOURCE_NOT_FOUND::asServiceException);

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
