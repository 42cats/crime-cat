package com.crimecat.backend.boardPost.service;

import com.crimecat.backend.boardPost.domain.PostComment;
import com.crimecat.backend.boardPost.dto.PostCommentResponse;
import com.crimecat.backend.boardPost.repository.PostCommentLikeRepository;
import com.crimecat.backend.boardPost.repository.PostCommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostCommentService {

    private final PostCommentRepository postCommentRepository;
    private final PostCommentLikeRepository postCommentLikeRepository;

    @Transactional(readOnly = true)
    public List<PostCommentResponse> getCommentResponses(
            UUID postId,
            UUID userId
    ) {
        Sort sort = Sort.by(Sort.Direction.ASC, "createdAt");

        List<PostComment> comments = postCommentRepository.findAllByPostIdAndParentIdIsNull(postId, sort);

        if (!comments.isEmpty()) {
            boolean isOwnPost = comments.getFirst().getBoardPost().getUserId().equals(userId);

            return comments.stream()
                    .map(comment -> {
                        boolean isLikedComment = postCommentLikeRepository.existsByCommentIdAndUserId(comment.getId(), userId);
                        boolean isOwnComment = comment.getUserId().equals(userId);
                        boolean canViewSecret = (isOwnComment || isOwnPost);
                        List<PostCommentResponse> replies = getCommentReplies(comment.getId(), userId, sort, isOwnComment);

                        return PostCommentResponse.from(comment, isLikedComment, isOwnComment, canViewSecret, replies);
            }).collect(Collectors.toList());
        } else {
            return new ArrayList<>();
        }

    }

    private List<PostCommentResponse> getCommentReplies(UUID commentId, UUID userId, Sort sort, boolean isOwnParent) {
        List<PostComment> replies = postCommentRepository.findAllByParentId(commentId, sort);
        List<PostCommentResponse> replyResponses = new ArrayList<>();

        for (PostComment reply : replies) {
            boolean isLiked = postCommentLikeRepository.existsByCommentIdAndUserId(reply.getId(), userId);
            boolean isOwnReply = reply.getUserId().equals(userId);
            boolean canViewSecret = (isOwnParent || isOwnReply);
            List<PostCommentResponse> commentReplies = getCommentReplies(reply.getId(), userId, sort, isOwnReply);
            replyResponses.add(PostCommentResponse.from(reply, isLiked, isOwnReply, canViewSecret, commentReplies));
        }

        return replyResponses;
    }
}
