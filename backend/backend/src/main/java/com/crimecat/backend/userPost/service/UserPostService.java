package com.crimecat.backend.userPost.service;

import com.crimecat.backend.userPost.dto.UserPostDto;
import com.crimecat.backend.userPost.dto.UserPostGalleryPageDto;
import com.crimecat.backend.webUser.domain.WebUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface UserPostService {

    /**
     * 유저 게시글 생성
     * @param user 로그인된 사용자 (webUser)
     * @param content 게시글 내용
     * @param imageIds 이미지uuid
     * @param imageUrls 업로드된 이미지 URL 리스트 (최대 5장)
     * @param isPrivate 비밀글 여부
     * @param isFollowersOnly 팔로워만 볼 수 있는 게시글 여부
     */
    void createUserPost(WebUser user, String content, List<UUID> imageIds, List<String> imageUrls, boolean isPrivate, boolean isFollowersOnly);
    
    /**
     * 기존 메서드와의 호환성을 위한 오버로딩 메서드
     */
    default void createUserPost(WebUser user, String content, List<UUID> imageIds, List<String> imageUrls) {
        createUserPost(user, content, imageIds, imageUrls, false, false);
    }

    /**
     * 유저 게시글 수정 (이미지는 교체 방식)
     */
    void updateUserPostPartially(
            UUID postId,
            WebUser user,
            String content,
            List<MultipartFile> newImages,
            List<UUID> newImageIds,
            List<String> keepImageUrls,
            boolean isPrivate,
            boolean isFollowersOnly
    );
    
    /**
     * 기존 메서드와의 호환성을 위한 오버로딩 메서드
     */
    default void updateUserPostPartially(
            UUID postId,
            WebUser user,
            String content,
            List<MultipartFile> newImages,
            List<UUID> newImageIds,
            List<String> keepImageUrls
    ) {
        updateUserPostPartially(postId, user, content, newImages, newImageIds, keepImageUrls, false, false);
    }

    /**
     * 유저 게시글 삭제
     */
    void deleteUserPost(UUID postId, Object currentUser);

    /**
     * 게시글 상세 조회 (단건)
     * @param postId 게시글 ID
     * @param currentUser 조회하는 사용자 (권한 처리 용)
     * @return 게시글 상세 정보
     */
    UserPostDto getUserPostDetail(UUID postId, WebUser currentUser);
    
    /**
     * 기존 메서드와 호환성을 위한 오버로딩 메서드
     */
    default UserPostDto getUserPostDetail(UUID postId) {
        // 권한 검사 없이 공개 게시글만 조회하는 경우
        return getUserPostDetail(postId, null);
    }

    /**
     * 게시글 관련 통계 정보 추가 (liked 표시)
     */
    UserPostDto enrichUserPostWithStats(UserPostDto postDto, WebUser currentUser);
    
    /**
     * 내가 좋아요 눌렀는지 여부 확인
     */
    boolean didILike(UUID postId, Object currentUser);

    /**
     * 좋아요 토글 (누르지 않았다면 추가, 이미 눌렀다면 취소)
     * @return true: 좋아요 상태, false: 좋아요 해제됨
     */
    boolean toggleLike(UUID postId, Object currentUser);

    /**
     * 갤러리형 게시글 목록 조회 (썸네일 포함)
     * @param currentUser 조회하는 사용자 (권한 처리용)
     */
    Page<UserPostGalleryPageDto> getUserPostGalleryPage(WebUser currentUser, Pageable pageable);
    
    /**
     * 기존 메서드와의 호환성을 위한 오버로딩 메서드
     */
    default Page<UserPostGalleryPageDto> getUserPostGalleryPage(Pageable pageable) {
        // 권한 검사 없이 공개 게시글만 조회하는 경우
        return getUserPostGalleryPage(null, pageable);
    }
    
    /**
     * 특정 사용자의 갤러리형 게시글 목록 조회 (썸네일 포함)
     * @param userId 사용자 ID
     * @param currentUser 조회하는 사용자 (권한 처리용)
     * @param pageable 페이지 정보
     * @return 특정 사용자의 게시글 갤러리 페이지
     */
    Page<UserPostGalleryPageDto> getUserPostGalleryPageByUserId(UUID userId, WebUser currentUser, Pageable pageable);
    
    /**
     * 기존 메서드와의 호환성을 위한 오버로딩 메서드
     */
    default Page<UserPostGalleryPageDto> getUserPostGalleryPageByUserId(UUID userId, Pageable pageable) {
        // 권한 검사 없이 공개 게시글만 조회하는 경우
        return getUserPostGalleryPageByUserId(userId, null, pageable);
    }
    
    /**
     * 현재 로그인한 사용자의 갤러리형 게시글 목록 조회 (썸네일 포함)
     * @param user 현재 로그인한 사용자
     * @param pageable 페이지 정보
     * @return 내 게시글 갤러리 페이지
     */
    Page<UserPostGalleryPageDto> getMyUserPostGalleryPage(WebUser user, Pageable pageable);
    
    /**
     * 다른 사용자가 특정 사용자의 팔로워인지 확인
     * @param userId 사용자 ID
     * @param followerId 팔로워인지 확인할 사용자 ID
     * @return 팔로워 여부
     */
    boolean isFollower(UUID userId, UUID followerId);
    
    /**
     * 게시글 접근 권한 확인
     * @param postId 게시글 ID
     * @param currentUser 접근하려는 사용자
     * @return 접근 가능 여부
     */
    boolean canAccessPost(UUID postId, WebUser currentUser);
}
