package com.crimecat.backend.userPost.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.storage.StorageFileType;
import com.crimecat.backend.storage.StorageService;
import com.crimecat.backend.userPost.domain.UserPost;
import com.crimecat.backend.userPost.domain.UserPostComment;
import com.crimecat.backend.userPost.domain.UserPostImage;
import com.crimecat.backend.userPost.domain.UserPostLike;
import com.crimecat.backend.userPost.dto.UserPostCommentDto;
import com.crimecat.backend.userPost.dto.UserPostDto;
import com.crimecat.backend.userPost.dto.UserPostGalleryPageDto;
import com.crimecat.backend.userPost.repository.UserPostCommentRepository;
import com.crimecat.backend.userPost.repository.UserPostImageRepository;
import com.crimecat.backend.userPost.repository.UserPostLikeRepository;
import com.crimecat.backend.userPost.repository.UserPostRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserPostServiceImpl implements UserPostService {

    private final UserPostRepository userPostRepository;
    private final UserPostImageRepository userPostImageRepository;
    private final UserPostLikeRepository userPostLikeRepository;
    private final UserPostCommentRepository userPostCommentRepository;
    private final StorageService storageService;
    private final com.crimecat.backend.webUser.repository.WebUserRepository webUserRepository;
    // Follow 관련 레포지토리 추가 필요 - 팔로워 기능은 나중에 구현

    @Override
    @Transactional
    public void createUserPost(WebUser user, String content, List<UUID> imageIds, List<String> imageUrls, boolean isPrivate, boolean isFollowersOnly) {
        UserPost post = UserPost.builder()
                .user(user)
                .content(content)
                .isPrivate(isPrivate)
                .isFollowersOnly(isFollowersOnly)
                .build();
        userPostRepository.save(post);

        List<UserPostImage> images = new ArrayList<>();
        for (int i = 0; i < imageUrls.size(); i++) {
            images.add(UserPostImage.from(imageIds.get(i), post, imageUrls.get(i), i));
        }
        userPostImageRepository.saveAll(images);
    }

    @Override
    @Transactional
    public void deleteUserPost(UUID postId, Object currentUser) {
        WebUser user = (WebUser) currentUser;

        UserPost post = userPostRepository.findByIdWithImages(postId)   // 이미지까지 함께 로딩
                .orElseThrow(ErrorStatus.USER_POST_NOT_FOUND::asServiceException);

        if (!post.getUser().getId().equals(user.getId())) {
            throw ErrorStatus.USER_POST_ACCESS_DENIED.asServiceException();
        }

        // 1️⃣ 로컬 파일 삭제
        for (UserPostImage img : post.getImages()) {
            String fileName = extractFilenameFromUrl(img.getImageUrl());
            storageService.delete(StorageFileType.USER_POST_IMAGE, fileName);
            // DB 삭제는 아래에서 post 제거 시 cascade (orphans) 로 처리됨
        }

        // 2️⃣ 게시글 · 이미지 · 좋아요 전부 DB 삭제(cascade = ALL)
        userPostRepository.delete(post);
    }

    @Override
    public UserPostDto getUserPostDetail(UUID postId, WebUser currentUser) {
        UserPost post = userPostRepository.findByIdWithUserAndImages(postId)
                .orElseThrow(ErrorStatus.USER_POST_NOT_FOUND::asServiceException);

        // 접근 권한 확인
        if (!canAccessPost(post, currentUser)) {
            throw ErrorStatus.USER_POST_ACCESS_DENIED.asServiceException();
        }

        List<String> images = post.getImages().stream()
                .sorted(Comparator.comparingInt(UserPostImage::getSortOrder))
                .map(UserPostImage::getImageUrl)
                .collect(Collectors.toList());
        
        // 좋아요 수는 별도 조회
        long likeCount = userPostLikeRepository.countByPostId(post.getId());

        // 댓글 불러오기
        List<UserPostComment> comments = userPostCommentRepository.findAllCommentsByPostId(postId);
        List<UserPostComment> parentComments = comments.stream()
                .filter(c -> c.getParent() == null)
                .collect(Collectors.toList());
        
        List<UserPostComment> childComments = comments.stream()
                .filter(c -> c.getParent() != null)
                .collect(Collectors.toList());
        
        // 댓글 DTO 변환 (계층 구조 생성)
        List<UserPostCommentDto> commentDtos = new ArrayList<>();
        if (currentUser != null) {
            UUID postAuthorId = post.getUser().getId();
            
            for (UserPostComment parentComment : parentComments) {
                commentDtos.add(UserPostCommentDto.fromWithReplies(
                        parentComment, 
                        childComments, 
                        currentUser.getId(), 
                        postAuthorId
                ));
            }
        }

        UserPostDto postDto = UserPostDto.builder()
                .postId(post.getId())
                .authorId(post.getUser().getId())
                .authorNickname(post.getUser().getNickname())
                .authorAvatarUrl(post.getUser().getProfileImagePath())
                .content(post.getContent())
                .imageUrls(images)
                .likeCount(Long.valueOf(likeCount).intValue())
                .isPrivate(post.isPrivate())
                .isFollowersOnly(post.isFollowersOnly())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .comments(commentDtos)
                .liked(false) // 기본값, 아래에서 업데이트
                .build();
        
        // 로그인한 사용자라면 좋아요 상태 확인
        if (currentUser != null) {
            return enrichUserPostWithStats(postDto, currentUser);
        }
        
        return postDto;
    }

    @Override
    public UserPostDto enrichUserPostWithStats(UserPostDto postDto, WebUser currentUser) {
        if (currentUser != null) {
            boolean liked = userPostLikeRepository.existsByPostIdAndUserId(
                    postDto.getPostId(), currentUser.getId());
            postDto.setLiked(liked);
        }
        return postDto;
    }

    @Override
    public boolean didILike(UUID postId, Object currentUser) {
        if (currentUser == null) {
            return false;
        }
        
        WebUser user = (WebUser) currentUser;
        return userPostLikeRepository.existsByPostIdAndUserId(postId, user.getId());
    }

    @Override
    @Transactional
    public boolean toggleLike(UUID postId, Object currentUser) {
        WebUser user = (WebUser) currentUser;

        // 게시글 존재 및 접근 권한 확인
        UserPost post = userPostRepository.findById(postId)
                .orElseThrow(ErrorStatus.USER_POST_NOT_FOUND::asServiceException);
        
        if (!canAccessPost(post, user)) {
            throw ErrorStatus.USER_POST_ACCESS_DENIED.asServiceException();
        }

        Optional<UserPostLike> likeOpt = userPostLikeRepository.findByPostIdAndUserId(postId, user.getId());
        if (likeOpt.isPresent()) {
            userPostLikeRepository.delete(likeOpt.get());
            return false;
        } else {
            UserPostLike like = UserPostLike.from(user, post);
            userPostLikeRepository.save(like);
            return true;
        }
    }

    @Override
    public Page<UserPostGalleryPageDto> getUserPostGalleryPage(WebUser currentUser, Pageable pageable) {
        Page<UserPost> posts;
        
        if (currentUser == null) {
            // 로그인하지 않은 사용자는 공개 게시글만 볼 수 있음
            posts = userPostRepository.findAllWithUserAndImages(pageable); // 목록 쿼리 개선 필요
        } else {
            // 로그인한 사용자는 자신의 게시글, 팔로워 공개글, 공개 게시글 볼 수 있음
            posts = userPostRepository.findAccessiblePostsForUser(currentUser.getId(), pageable);
        }

        return posts.map(post -> {
            String thumbnail = post.getImages().stream()
                    .sorted(Comparator.comparingInt(UserPostImage::getSortOrder))
                    .findFirst()
                    .map(UserPostImage::getImageUrl)
                    .orElse(null);

            // 좋아요 수는 별도 조회
            long likeCount = userPostLikeRepository.countByPostId(post.getId());

            return UserPostGalleryPageDto.builder()
                    .postId(post.getId())
                    .authorId(post.getUser().getId())
                    .authorNickname(post.getUser().getNickname())
                    .content(post.getContent())
                    .thumbnailUrl(thumbnail)
                    .likeCount(Long.valueOf(likeCount).intValue())
                    .isPrivate(post.isPrivate())
                    .isFollowersOnly(post.isFollowersOnly())
                    .createdAt(post.getCreatedAt())
                    .build();
        });
    }

    @Override
    @Transactional
    public void updateUserPostPartially(
            UUID postId,
            WebUser user,
            String content,
            List<MultipartFile> newImages,
            List<UUID> newImageIds,
            List<String> keepImageUrls,
            boolean isPrivate,
            boolean isFollowersOnly) {

        UserPost post = userPostRepository.findByIdWithImages(postId)
                .orElseThrow(ErrorStatus.USER_POST_NOT_FOUND::asServiceException);

        if (!post.getUser().getId().equals(user.getId())) {
            throw ErrorStatus.USER_POST_ACCESS_DENIED.asServiceException();
        }

        // ── 입력 검증 ──────────────────────────────────────
        int keepCnt = keepImageUrls == null ? 0 : keepImageUrls.size();
        int newCnt  = newImages     == null ? 0 : newImages.size();

        if (newCnt != (newImageIds == null ? 0 : newImageIds.size())) {
            throw ErrorStatus.USER_POST_INVALID_UPDATE.asServiceException();
        }
        if (keepCnt + newCnt > 5) {
            throw ErrorStatus.USER_POST_IMAGE_COUNT_EXCEEDED.asServiceException();
        }

        // ── 유지·삭제 이미지 분리 ──────────────────────────
        List<UserPostImage> keepImages = post.getImages().stream()
                .filter(img -> keepImageUrls != null && keepImageUrls.contains(img.getImageUrl()))
                .sorted(Comparator.comparingInt(UserPostImage::getSortOrder))
                .toList();

        List<UserPostImage> toRemove = post.getImages().stream()
                .filter(img -> keepImageUrls == null || !keepImageUrls.contains(img.getImageUrl()))
                .toList();

        // ── 삭제 처리 ─────────────────────────────────────

        List<UUID> idsToRemove = toRemove.stream()
                .map(UserPostImage::getId)
                .toList();

        for (UserPostImage img : toRemove) {
            String fileName =  extractFilenameFromUrl(img.getImageUrl());
            storageService.delete(StorageFileType.USER_POST_IMAGE, fileName);
            userPostImageRepository.deleteUserPostImagesById(img.getId());
        }

        if (!idsToRemove.isEmpty()) {
            userPostImageRepository.deleteAllByIdInBatch(idsToRemove);
        }

        // ── 새 이미지 저장 ────────────────────────────────
        List<UserPostImage> newEntities = new ArrayList<>();
        if (newImages != null) {
            int startOrder = keepImages.size();
            for (int i = 0; i < newImages.size(); i++) {
                MultipartFile file   = newImages.get(i);
                UUID          imgId  = newImageIds.get(i);
                
                // UUID만 사용
                String fileId = imgId.toString();
                
                // 이미지 저장 (StorageService에서 자동으로 확장자 추가함)
                String url = storageService.storeAt(
                        StorageFileType.USER_POST_IMAGE,
                        file,
                        fileId);

                newEntities.add(UserPostImage.from(imgId, post, url, startOrder + i));
            }
            userPostImageRepository.saveAll(newEntities);
        }

        // ── 정렬 순서 재조정 (Dirty checking) ──────────────
        List<UserPostImage> all = new ArrayList<>(keepImages);
        all.addAll(newEntities);
        for (int i = 0; i < all.size(); i++) {
            all.get(i).setSortOrder(i);
        }

        // ── 본문 수정 ────────────────────────────────────
        post.setContent(content);
        
        // ── 비밀글/팔로워 공개 설정 수정 ───────────────────
        post.setIsPrivate(isPrivate);
        post.setIsFollowersOnly(isFollowersOnly);
    }

    @Override
    public Page<UserPostGalleryPageDto> getUserPostGalleryPageByUserId(UUID userId, WebUser currentUser, Pageable pageable) {
        // 사용자 ID로 WebUser 객체 조회 - 존재하지 않을 경우 예외 발생
        WebUser targetUser = webUserRepository.findById(userId)
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
        
        Page<UserPost> posts;
        
        if (currentUser == null) {
            // 로그인하지 않은 사용자는 공개 게시글만 볼 수 있음
            // TODO: 공개 게시글만 조회하는 쿼리로 변경 필요
            posts = userPostRepository.findByUserWithImages(targetUser, pageable);
        } else if (currentUser.getId().equals(userId)) {
            // 자신의 게시글은 모두 볼 수 있음
            posts = userPostRepository.findByUserWithImages(targetUser, pageable);
        } else {
            // 다른 사용자의 게시글은 접근 권한에 따라 필터링
            posts = userPostRepository.findAccessiblePostsByUserIdForViewer(userId, currentUser.getId(), pageable);
        }

        return posts.map(post -> {
            String thumbnail = post.getImages().stream()
                    .sorted(Comparator.comparingInt(UserPostImage::getSortOrder))
                    .findFirst()
                    .map(UserPostImage::getImageUrl)
                    .orElse(null);

            // 좋아요 수는 별도 조회
            long likeCount = userPostLikeRepository.countByPostId(post.getId());

            return UserPostGalleryPageDto.builder()
                    .postId(post.getId())
                    .authorId(post.getUser().getId())
                    .authorNickname(post.getUser().getNickname())
                    .content(post.getContent())
                    .thumbnailUrl(thumbnail)
                    .likeCount(Long.valueOf(likeCount).intValue())
                    .isPrivate(post.isPrivate())
                    .isFollowersOnly(post.isFollowersOnly())
                    .createdAt(post.getCreatedAt())
                    .build();
        });
    }

    @Override
    public Page<UserPostGalleryPageDto> getMyUserPostGalleryPage(WebUser user, Pageable pageable) {
        Page<UserPost> posts = userPostRepository.findByUserWithImages(user, pageable);

        return posts.map(post -> {
            String thumbnail = post.getImages().stream()
                    .sorted(Comparator.comparingInt(UserPostImage::getSortOrder))
                    .findFirst()
                    .map(UserPostImage::getImageUrl)
                    .orElse(null);

            // 좋아요 수는 별도 조회
            long likeCount = userPostLikeRepository.countByPostId(post.getId());

            return UserPostGalleryPageDto.builder()
                    .postId(post.getId())
                    .authorId(post.getUser().getId())
                    .authorNickname(post.getUser().getNickname())
                    .content(post.getContent())
                    .thumbnailUrl(thumbnail)
                    .likeCount(Long.valueOf(likeCount).intValue())
                    .isPrivate(post.isPrivate())
                    .isFollowersOnly(post.isFollowersOnly())
                    .createdAt(post.getCreatedAt())
                    .build();
        });
    }
    
    @Override
    public boolean isFollower(UUID userId, UUID followerId) {
        // TODO: 팔로워 기능 구현 시 추가
        // 현재는 팔로워 관계가 구현되지 않았으므로 임시로 false 반환
        return false;
    }
    
    @Override
    public boolean canAccessPost(UUID postId, WebUser currentUser) {
        UserPost post = userPostRepository.findByIdWithUserAndImages(postId)
                .orElseThrow(ErrorStatus.USER_POST_NOT_FOUND::asServiceException);
        
        return canAccessPost(post, currentUser);
    }
    
    /**
     * 게시글 접근 권한 확인
     * @param post 게시글
     * @param currentUser 접근하려는 사용자
     * @return 접근 가능 여부
     */
    private boolean canAccessPost(UserPost post, WebUser currentUser) {
        // 작성자 본인은 항상 접근 가능
        if (currentUser != null && post.getUser().getId().equals(currentUser.getId())) {
            return true;
        }
        
        // 비밀글은 작성자만 볼 수 있음
        if (post.isPrivate()) {
            return false;
        }
        
        // 팔로워 공개글은 팔로워만 볼 수 있음
        if (post.isFollowersOnly()) {
            return currentUser != null && isFollower(post.getUser().getId(), currentUser.getId());
        }
        
        // 그 외에는 모두 볼 수 있음
        return true;
    }

    /**
     * 이미지 URL에서 파일명만 추출합니다.
     * 
     * @param imageUrl 이미지 URL
     * @return 파일명
     */
    public String extractFilenameFromUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return "";
        }
        
        // URL에서 마지막 / 이후의 문자열을 추출
        int lastSlashIndex = imageUrl.lastIndexOf('/');
        if (lastSlashIndex == -1 || lastSlashIndex == imageUrl.length() - 1) {
            return imageUrl; // / 기호가 없거나 URL이 /로 끝나는 경우
        }
        
        return imageUrl.substring(lastSlashIndex + 1);
    }
}
