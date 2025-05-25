package com.crimecat.backend.boardPost.service;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.crimecat.backend.boardPost.domain.PostComment;
import com.crimecat.backend.boardPost.domain.PostCommentLike;
import com.crimecat.backend.boardPost.dto.PostCommentRequest;
import com.crimecat.backend.boardPost.dto.PostCommentResponse;
import com.crimecat.backend.boardPost.repository.BoardPostRepository;
import com.crimecat.backend.boardPost.repository.PostCommentLikeRepository;
import com.crimecat.backend.boardPost.repository.PostCommentRepository;
import com.crimecat.backend.notification.event.NotificationEventPublisher;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class PostCommentService {

    private final PostCommentRepository postCommentRepository;
    private final PostCommentLikeRepository postCommentLikeRepository;
    private final BoardPostRepository boardPostRepository;
    private final NotificationEventPublisher notificationEventPublisher;

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

    @Transactional(readOnly = true)
    public Page<PostCommentResponse> getCommentResponsesPage(
            UUID postId,
            UUID userId,
            int page,
            int size
    ) {
        Sort sort = Sort.by(Sort.Direction.ASC, "createdAt");
        PageRequest pageRequest = PageRequest.of(page, size, sort);
        
        // 게시글 존재 여부 확인
        BoardPost boardPost = boardPostRepository.findByIdAndIsDeletedFalse(postId)
            .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));
        
        // 루트 댓글만 페이지네이션으로 조회
        Page<PostComment> commentPage = postCommentRepository.findAllByBoardPostAndParentIdIsNullAndIsDeletedFalse(boardPost, pageRequest);
        
        // 현재 사용자가 게시글 작성자인지 확인
        boolean isOwnPost = userId != null && boardPost.getAuthorId().equals(userId);
        
        // 각 댓글을 PostCommentResponse로 변환
        List<PostCommentResponse> content = commentPage.getContent().stream()
            .map(comment -> {
                boolean isLikedComment = userId != null && postCommentLikeRepository.existsByCommentIdAndUserId(comment.getId(), userId);
                boolean isOwnComment = userId != null && comment.getAuthorId().equals(userId);
                boolean canViewSecret = (isOwnComment || isOwnPost);
                List<PostCommentResponse> replies = getCommentReplies(comment.getId(), userId, sort, isOwnComment);
                
                return PostCommentResponse.from(comment, isLikedComment, isOwnComment, canViewSecret, replies);
            })
            .collect(Collectors.toList());
        
        return new PageImpl<>(content, pageRequest, commentPage.getTotalElements());
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
    public PostCommentResponse createPostComment(
            UUID postId,
            WebUser user,
            PostCommentRequest postCommentRequest
    ) {
        BoardPost boardPost = boardPostRepository.findByIdAndIsDeletedFalse(postId).orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));
        PostComment parent = null;
        if (postCommentRequest.getParentId() != null) {
            parent = postCommentRepository.findById(postCommentRequest.getParentId()).get();
        }
        PostComment postComment = PostComment.from(boardPost, user, parent, postCommentRequest);
        PostComment savedComment = postCommentRepository.save(postComment);
        postCommentRepository.flush();
        boardPostRepository.updateComments(postId, postCommentRepository.countAllByPostIdAndIsDeletedFalse(postId));
        
        // 저장된 댓글을 PostCommentResponse로 변환하여 반환
        boolean isOwnPost = boardPost.getAuthorId().equals(user.getId());
        boolean isOwnComment = true; // 방금 작성한 댓글이므로 항상 true
        boolean canViewSecret = true; // 자신이 작성한 댓글이므로 항상 true
        List<PostCommentResponse> replies = new ArrayList<>(); // 새 댓글은 답글이 없음
        
        // 알림 발행
        if (parent != null) {
            // 부모 댓글이 있는 경우 - 부모 댓글 작성자에게 알림
            WebUser parentAuthor = parent.getAuthor();
            // 자기 자신에게는 알림을 보내지 않음 & commentComment 설정 확인
            if (!parentAuthor.getId().equals(user.getId()) && 
                parentAuthor.getCommentComment() && 
                parentAuthor.getUser() != null) {
                notificationEventPublisher.publishUserPostCommentReplied(
                    this,
                    parentAuthor.getUser().getId(), // User ID 사용
                    savedComment.getId(),
                    savedComment.getContent(),
                    parent.getId(),
                    postId,
                    user.getUser().getId(), // User ID 사용
                    user.getNickname(),
                    boardPost.getBoardType().name() // BoardType 전달
                );
            }
        }
        
        // 게시글 작성자에게 알림 (부모 댓글 작성자와 중복 체크)
        WebUser postAuthor = boardPost.getAuthor();
        boolean alreadyNotified = parent != null && parent.getAuthorId().equals(boardPost.getAuthorId());
        
        // 자기 자신에게는 알림을 보내지 않음 & postComment 설정 확인 & 중복 제거
        if (!postAuthor.getId().equals(user.getId()) && 
            postAuthor.getPostComment() && 
            !alreadyNotified && 
            postAuthor.getUser() != null) {
            notificationEventPublisher.publishUserPostCommented(
                this,
                postAuthor.getUser().getId(), // User ID 사용
                savedComment.getId(),
                savedComment.getContent(),
                postId,
                user.getUser().getId(), // User ID 사용
                user.getNickname(),
                boardPost.getBoardType().name() // BoardType 전달
            );
        }
        
        return PostCommentResponse.from(savedComment, false, isOwnComment, canViewSecret, replies);
    }

    @Transactional
    public PostCommentResponse updatePostComment(
            UUID commentId,
            UUID userId,
            PostCommentRequest postCommentRequest
    ) {
        PostComment postComment = postCommentRepository.findByIdAndIsDeletedFalse(commentId).orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));
        if (!postComment.getAuthorId().equals(userId)) {
            throw new AccessDeniedException("댓글을 수정할 권한이 없습니다");
        }
        postComment.update(postCommentRequest);
        PostComment updatedComment = postCommentRepository.save(postComment);
        
        // 수정된 댓글을 PostCommentResponse로 변환하여 반환
        BoardPost boardPost = updatedComment.getBoardPost();
        boolean isOwnPost = boardPost.getAuthorId().equals(userId);
        boolean isOwnComment = true; // 자신이 수정한 댓글이므로 항상 true
        boolean canViewSecret = true; // 자신이 수정한 댓글이므로 항상 true
        boolean isLiked = postCommentLikeRepository.existsByCommentIdAndUserId(updatedComment.getId(), userId);
        Sort sort = Sort.by(Sort.Direction.ASC, "createdAt");
        List<PostCommentResponse> replies = getCommentReplies(updatedComment.getId(), userId, sort, isOwnComment);
        
        return PostCommentResponse.from(updatedComment, isLiked, isOwnComment, canViewSecret, replies);
    }

    @Transactional
    public void deletePostComment(
            UUID commentId,
            UUID userId
    ) {
        PostComment postComment = postCommentRepository.findByIdAndIsDeletedFalse(commentId).orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));
        if (!postComment.getAuthorId().equals(userId)) {
            throw new AccessDeniedException("댓글을 삭제할 권한이 없습니다");
        }
        postComment.delete();
        postCommentRepository.save(postComment);
        postCommentRepository.flush();
        boardPostRepository.updateComments(postComment.getPostId(), postCommentRepository.countAllByPostIdAndIsDeletedFalse(postComment.getPostId()));
    }
    
    @Transactional
    public void toggleCommentLike(UUID commentId, UUID userId) {
        PostComment comment = postCommentRepository.findByIdAndIsDeletedFalse(commentId)
            .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));
        
        Optional<PostCommentLike> existingLike = postCommentLikeRepository.findByCommentIdAndUserId(commentId, userId);
        
        if (existingLike.isPresent()) {
            // 좋아요 취소
            postCommentLikeRepository.delete(existingLike.get());
            comment.decrementLikes();
        } else {
            // 좋아요 추가
            PostCommentLike newLike = PostCommentLike.builder()
                .userId(userId)
                .commentId(commentId)
                .createdAt(LocalDateTime.now())
                .build();
            postCommentLikeRepository.save(newLike);
            comment.incrementLikes();
        }
        
        postCommentRepository.save(comment);
    }
}
