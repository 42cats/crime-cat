package com.crimecat.backend.boardPost.service;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.crimecat.backend.boardPost.domain.PostComment;
import com.crimecat.backend.boardPost.dto.PostCommentRequest;
import com.crimecat.backend.boardPost.dto.PostCommentResponse;
import com.crimecat.backend.boardPost.repository.BoardPostRepository;
import com.crimecat.backend.boardPost.repository.PostCommentLikeRepository;
import com.crimecat.backend.boardPost.repository.PostCommentRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostCommentService {

    private final PostCommentRepository postCommentRepository;
    private final PostCommentLikeRepository postCommentLikeRepository;
    private final BoardPostRepository boardPostRepository;

    @Transactional(readOnly = true)
    public List<PostCommentResponse> getCommentResponses(
            UUID postId,
            UUID userId
    ) {
        Sort sort = Sort.by(Sort.Direction.ASC, "createdAt");

        List<PostComment> comments = postCommentRepository.findAllByPostIdAndParentIdIsNull(postId, sort);

        if (!comments.isEmpty()) {
            boolean isOwnPost = comments.getFirst().getBoardPost().getAuthorId().equals(userId);

            return comments.stream()
                    .map(comment -> {
                        boolean isLikedComment = postCommentLikeRepository.existsByCommentIdAndUserId(comment.getId(), userId);
                        boolean isOwnComment = comment.getAuthorId().equals(userId);
                        boolean canViewSecret = (isOwnComment || isOwnPost);
                        List<PostCommentResponse> replies = getCommentReplies(comment.getId(), userId, sort, isOwnComment);

                        return PostCommentResponse.from(comment, isLikedComment, isOwnComment, canViewSecret, replies);
            }).collect(Collectors.toList());
        } else {
            return new ArrayList<>();
        }

    }

    public List<PostCommentResponse> getCommentReplies(UUID commentId, UUID userId, Sort sort, boolean isOwnParent) {
        List<PostComment> replies = postCommentRepository.findAllByParentId(commentId, sort);
        List<PostCommentResponse> replyResponses = new ArrayList<>();

        for (PostComment reply : replies) {
            boolean isLiked = postCommentLikeRepository.existsByCommentIdAndUserId(reply.getId(), userId);
            boolean isOwnReply = reply.getAuthorId().equals(userId);
            boolean canViewSecret = (isOwnParent || isOwnReply);
            List<PostCommentResponse> commentReplies = getCommentReplies(reply.getId(), userId, sort, isOwnReply);
            replyResponses.add(PostCommentResponse.from(reply, isLiked, isOwnReply, canViewSecret, commentReplies));
        }

        return replyResponses;
    }

    @Transactional
    public List<PostCommentResponse> createPostComment(
            UUID postId,
            WebUser user,
            PostCommentRequest postCommentRequest
    ) {
        BoardPost boardPost = boardPostRepository.findByIdAndIsDeletedFalse(postId).orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));
        PostComment postComment = PostComment.from(boardPost, user, postCommentRequest);
        postCommentRepository.save(postComment);
        return getCommentResponses(postId, user.getId());
    }

    @Transactional
    public List<PostCommentResponse> updatePostComment(
            UUID commentId,
            UUID userId,
            PostCommentRequest postCommentRequest
    ) {
        PostComment postComment = postCommentRepository.findByIdAndIsDeletedFalse(commentId).orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));
        if (!postComment.getAuthorId().equals(userId)) {
            throw new AccessDeniedException("댓글을 수정할 권한이 없습니다");
        }
        postComment.update(postCommentRequest);
        postCommentRepository.save(postComment);
        return getCommentResponses(postComment.getPostId(), userId);
    }

    @Transactional
    public List<PostCommentResponse> deletePostComment(
            UUID commentId,
            UUID userId
    ) {
        PostComment postComment = postCommentRepository.findByIdAndIsDeletedFalse(commentId).orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));
        if (!postComment.getAuthorId().equals(userId)) {
            throw new AccessDeniedException("댓글을 삭제할 권한이 없습니다");
        }
        postComment.delete();
        postCommentRepository.save(postComment);
        return getCommentResponses(postComment.getPostId(), userId);
    }
}
