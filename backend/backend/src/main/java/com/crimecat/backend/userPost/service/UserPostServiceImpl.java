package com.crimecat.backend.userPost.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.userPost.domain.UserPost;
import com.crimecat.backend.userPost.domain.UserPostImage;
import com.crimecat.backend.userPost.domain.UserPostLike;
import com.crimecat.backend.userPost.dto.UserPostDto;
import com.crimecat.backend.userPost.dto.UserPostGalleryPageDto;
import com.crimecat.backend.userPost.repository.UserPostImageRepository;
import com.crimecat.backend.userPost.repository.UserPostLikeRepository;
import com.crimecat.backend.userPost.repository.UserPostRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserPostServiceImpl implements UserPostService {

    private final UserPostRepository userPostRepository;
    private final UserPostImageRepository userPostImageRepository;
    private final UserPostLikeRepository userPostLikeRepository;

    @Override
    @Transactional
    public void createUserPost(Object currentUser, String content, List<String> imageUrls) {
        WebUser user = (WebUser) currentUser;
        UserPost post = UserPost.builder()
                .user(user)
                .content(content)
                .build();
        userPostRepository.save(post);

        List<UserPostImage> images = new ArrayList<>();
        for (int i = 0; i < imageUrls.size(); i++) {
            images.add(UserPostImage.from(post, imageUrls.get(i), i));
        }
        userPostImageRepository.saveAll(images);
    }

    @Override
    @Transactional
    public void updateUserPost(UUID postId, Object currentUser, String content, List<String> imageUrls) {
        WebUser user = (WebUser) currentUser;
        UserPost post = userPostRepository.findById(postId)
                .orElseThrow(ErrorStatus.USER_POST_NOT_FOUND::asServiceException);

        if (!post.getUser().getId().equals(user.getId())) {
            throw ErrorStatus.USER_POST_ACCESS_DENIED.asServiceException();
        }

        post.setContent(content);

        userPostImageRepository.deleteByPost(post);

        for (int i = 0; i < imageUrls.size(); i++) {
            UserPostImage image = UserPostImage.from(post,imageUrls.get(i), i);
            userPostImageRepository.save(image);
        }
    }

    @Override
    @Transactional
    public void deleteUserPost(UUID postId, Object currentUser) {
        WebUser user = (WebUser) currentUser;
        UserPost post = userPostRepository.findById(postId)
                .orElseThrow(ErrorStatus.USER_POST_NOT_FOUND::asServiceException);

        if (!post.getUser().getId().equals(user.getId())) {
            throw ErrorStatus.USER_POST_ACCESS_DENIED.asServiceException();
        }

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
}