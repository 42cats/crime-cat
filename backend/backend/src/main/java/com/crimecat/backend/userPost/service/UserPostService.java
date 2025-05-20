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
     * @return 생성된 게시글 ID
     */
    void createUserPost(WebUser user, String content, List<UUID> imageIds, List<String> imageUrls);

    /**
     * 유저 게시글 수정 (이미지는 교체 방식)
     */
    void updateUserPostPartially(
            UUID postId,
            WebUser user,
            String content,
            List<MultipartFile> newImages,
            List<UUID> newImageIds,
            List<String> keepImageUrls
    );

    /**
     * 유저 게시글 삭제
     */
    void deleteUserPost(UUID postId, Object currentUser);

    /**
     * 게시글 상세 조회 (단건)
     */
    UserPostDto getUserPostDetail(UUID postId);

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
     */
    Page<UserPostGalleryPageDto> getUserPostGalleryPage(Pageable pageable);

}
