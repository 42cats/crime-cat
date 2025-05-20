package com.crimecat.backend.userPost.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.storage.StorageFileType;
import com.crimecat.backend.storage.StorageService;
import com.crimecat.backend.userPost.domain.UserPost;
import com.crimecat.backend.userPost.domain.UserPostImage;
import com.crimecat.backend.userPost.domain.UserPostLike;
import com.crimecat.backend.userPost.dto.UserPostDto;
import com.crimecat.backend.userPost.dto.UserPostGalleryPageDto;
import com.crimecat.backend.userPost.repository.UserPostImageRepository;
import com.crimecat.backend.userPost.repository.UserPostLikeRepository;
import com.crimecat.backend.userPost.repository.UserPostRepository;
import com.crimecat.backend.utils.FileUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserPostServiceImpl implements UserPostService {

    private final UserPostRepository userPostRepository;
    private final UserPostImageRepository userPostImageRepository;
    private final UserPostLikeRepository userPostLikeRepository;
    private final StorageService storageService;

    @Override
    @Transactional
    public void createUserPost(WebUser user, String content, List<UUID> imageIds, List<String> imageUrls) {
        UserPost post = UserPost.builder()
                .user(user)
                .content(content)
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
    public UserPostDto getUserPostDetail(UUID postId) {
        UserPost post = userPostRepository.findByIdWithUserAndImages(postId)
                .orElseThrow(ErrorStatus.USER_POST_NOT_FOUND::asServiceException);

        List<String> images = post.getImages().stream()
                .sorted(Comparator.comparingInt(UserPostImage::getSortOrder))
                .map(UserPostImage::getImageUrl)
                .collect(Collectors.toList());

        return UserPostDto.builder()
                .postId(post.getId())
                .authorNickname(post.getUser().getNickname())
                .authorAvatarUrl(post.getUser().getProfileImagePath())
                .content(post.getContent())
                .imageUrls(images)
                .likeCount(post.getLikes().size())
                .liked(false) // 로그인 여부 판단 불가
                .build();
    }

    @Override
    public boolean didILike(UUID postId, Object currentUser) {
        WebUser user = (WebUser) currentUser;
        return userPostLikeRepository.existsByPostIdAndUserId(postId, user.getId());
    }

    @Override
    @Transactional
    public boolean toggleLike(UUID postId, Object currentUser) {
        WebUser user = (WebUser) currentUser;

        Optional<UserPostLike> likeOpt = userPostLikeRepository.findByPostIdAndUserId(postId, user.getId());
        if (likeOpt.isPresent()) {
            userPostLikeRepository.delete(likeOpt.get());
            return false;
        } else {
            UserPost post = userPostRepository.findById(postId)
                    .orElseThrow(ErrorStatus.USER_POST_NOT_FOUND::asServiceException);
            UserPostLike like = UserPostLike.from(user, post);
            userPostLikeRepository.save(like);
            return true;
        }
    }

    @Override
    public Page<UserPostGalleryPageDto> getUserPostGalleryPage(Pageable pageable) {
        Page<UserPost> posts = userPostRepository.findAllWithUserAndImages(pageable);

        return posts.map(post -> {
            String thumbnail = post.getImages().stream()
                    .sorted(Comparator.comparingInt(UserPostImage::getSortOrder))
                    .findFirst()
                    .map(UserPostImage::getImageUrl)
                    .orElse(null);

            return UserPostGalleryPageDto.builder()
                    .postId(post.getId())
                    .authorNickname(post.getUser().getNickname())
                    .content(post.getContent())
                    .thumbnailUrl(thumbnail)
                    .likeCount(post.getLikes().size())
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
            List<String> keepImageUrls) {

        UserPost post = userPostRepository.findByIdWithImages(postId)
                .orElseThrow(ErrorStatus.USER_POST_NOT_FOUND::asServiceException);

        if (!post.getUser().getId().equals(user.getId())) {
            throw ErrorStatus.USER_POST_ACCESS_DENIED.asServiceException();
        }

        // ── 입력 검증 ──────────────────────────────────────
        int keepCnt = keepImageUrls == null ? 0 : keepImageUrls.size();
        int newCnt  = newImages     == null ? 0 : newImages.size();

        if (newCnt != (newImageIds == null ? 0 : newImageIds.size())) {
            throw ErrorStatus.INVALID_INPUT.asServiceException();
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
        for (UserPostImage img : toRemove) {
            String fileName =  extractFilenameFromUrl(img.getImageUrl());
            storageService.delete(StorageFileType.USER_POST_IMAGE, fileName);
            userPostImageRepository.delete(img);
        }

        // ── 새 이미지 저장 ────────────────────────────────
        List<UserPostImage> newEntities = new ArrayList<>();
        if (newImages != null) {
            int startOrder = keepImages.size();
            for (int i = 0; i < newImages.size(); i++) {
                MultipartFile file   = newImages.get(i);
                UUID          imgId  = newImageIds.get(i);
                String ext           = FileUtil.getExtension(file.getOriginalFilename());
                String url           = storageService.storeAt(
                        StorageFileType.USER_POST_IMAGE,
                        file,
                        imgId + ext);

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
    }

    public String extractFilenameFromUrl(String imageUrl) {
        return imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
    }
}