package com.crimecat.backend.userPost.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.notification.event.NotificationEventPublisher;
import com.crimecat.backend.notification.event.UserPostCommentedEvent;
import com.crimecat.backend.notification.event.UserPostCommentRepliedEvent;
import com.crimecat.backend.userPost.domain.UserPost;
import com.crimecat.backend.userPost.domain.UserPostComment;
import com.crimecat.backend.userPost.dto.UserPostCommentDto;
import com.crimecat.backend.userPost.dto.UserPostCommentRequest;
import com.crimecat.backend.userPost.repository.UserPostCommentRepository;
import com.crimecat.backend.userPost.repository.UserPostRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserPostCommentServiceImpl implements UserPostCommentService {

    private final UserPostRepository userPostRepository;
    private final UserPostCommentRepository userPostCommentRepository;
    private final NotificationEventPublisher notificationEventPublisher;

    @Override
    @Transactional
    public UserPostCommentDto createComment(UUID postId, WebUser author, UserPostCommentRequest request) {
        // 게시글 존재 확인
        UserPost post = userPostRepository.findById(postId)
                .orElseThrow(ErrorStatus.USER_POST_NOT_FOUND::asServiceException);
        
        // 부모 댓글이 있는 경우 존재 확인
        UserPostComment parentComment = null;
        if (request.getParentId() != null) {
            parentComment = userPostCommentRepository.findById(request.getParentId())
                    .orElseThrow(ErrorStatus.COMMENT_NOT_FOUND::asServiceException);
            
            // 부모 댓글이 다른 게시글의 댓글인지 확인
            if (!parentComment.getPost().getId().equals(postId)) {
                throw ErrorStatus.COMMENT_INVALID_PARENT.asServiceException();
            }
            
            // 대댓글에 대한 대댓글은 허용하지 않음 (1단계만 허용)
            if (parentComment.getParent() != null) {
                throw ErrorStatus.COMMENT_INVALID_NESTING.asServiceException();
            }
        }
        
        // 댓글 생성
        UserPostComment comment = UserPostComment.builder()
                .content(request.getContent())
                .post(post)
                .author(author)
                .isPrivate(request.isPrivate())
                .build();
        
        // 부모 댓글 설정
        if (parentComment != null) {
            comment.setParent(parentComment);
        }
        
        userPostCommentRepository.save(comment);
        
        // 알림 발송 (비동기)
        CompletableFuture.runAsync(() -> {
            try {
                if (parentComment != null) {
                    // 대댓글인 경우 - 부모 댓글 작성자에게 알림
                    WebUser parentCommentAuthor = parentComment.getAuthor();
                    if (!parentCommentAuthor.getId().equals(author.getId()) && // 자기 자신에게는 알림 안보냄
                        parentCommentAuthor.isNotificationEnabled("userPostCommentReply")) {
                        
                        UserPostCommentRepliedEvent event = UserPostCommentRepliedEvent.of(
                            this,
                            parentCommentAuthor.getId(),
                            comment.getId(),
                            comment.getContent(),
                            parentComment.getId(),
                            post.getId(),
                            author.getId(),
                            author.getNickname()
                        );
                        notificationEventPublisher.publishEvent(event);
                    }
                } else {
                    // 일반 댓글인 경우 - 포스트 작성자에게 알림
                    WebUser postAuthor = post.getUser();
                    if (!postAuthor.getId().equals(author.getId()) && // 자기 자신에게는 알림 안보냄
                        postAuthor.isNotificationEnabled("userPostComment")) {
                        
                        UserPostCommentedEvent event = UserPostCommentedEvent.of(
                            this,
                            postAuthor.getId(),
                            comment.getId(),
                            comment.getContent(),
                            post.getId(),
                            author.getId(),
                            author.getNickname()
                        );
                        notificationEventPublisher.publishEvent(event);
                    }
                }
            } catch (Exception e) {
                // 알림 발송 실패가 댓글 생성에 영향주지 않도록 로깅만 처리
                System.err.println("Failed to send comment notification: " + e.getMessage());
            }
        });
        
        // 방금 작성한 댓글이므로 항상 볼 수 있음
        return UserPostCommentDto.from(comment, true, author.getId());
    }

    @Override
    @Transactional
    public UserPostCommentDto updateComment(UUID commentId, WebUser author, UserPostCommentRequest request) {
        // 댓글 존재 확인
        UserPostComment comment = userPostCommentRepository.findById(commentId)
                .orElseThrow(ErrorStatus.COMMENT_NOT_FOUND::asServiceException);
        
        // 작성자만 수정 가능
        if (!comment.getAuthor().getId().equals(author.getId())) {
            throw ErrorStatus.COMMENT_NOT_AUTHORIZED.asServiceException();
        }
        
        // 삭제된 댓글은 수정 불가
        if (comment.isDeleted()) {
            throw ErrorStatus.COMMENT_ALREADY_DELETED.asServiceException();
        }
        
        // 댓글 수정
        comment.update(request.getContent(), request.isPrivate());
        
        // 저장
        userPostCommentRepository.save(comment);
        
        // 방금 수정한 댓글이므로 항상 볼 수 있음
        return UserPostCommentDto.from(comment, true, author.getId());
    }

    @Override
    @Transactional
    public void deleteComment(UUID commentId, WebUser currentUser) {
        // 댓글 존재 확인
        UserPostComment comment = userPostCommentRepository.findByIdWithAuthorAndPost(commentId)
                .orElseThrow(ErrorStatus.COMMENT_NOT_FOUND::asServiceException);
        
        // 작성자 또는 게시글 작성자만 삭제 가능
        if (!comment.getAuthor().getId().equals(currentUser.getId()) && 
                !comment.getPost().getUser().getId().equals(currentUser.getId())) {
            throw ErrorStatus.COMMENT_NOT_AUTHORIZED.asServiceException();
        }
        
        // 이미 삭제된 댓글인지 확인
        if (comment.isDeleted()) {
            throw ErrorStatus.COMMENT_ALREADY_DELETED.asServiceException();
        }
        
        // 소프트 딜리트
        comment.delete();
        userPostCommentRepository.save(comment);
    }

    @Override
    public Page<UserPostCommentDto> getCommentsByPostId(UUID postId, WebUser currentUser, Pageable pageable) {
        // 게시글 존재 확인 및 접근 권한 확인
        UserPost post = userPostRepository.findByIdWithUserAndImages(postId)
                .orElseThrow(ErrorStatus.USER_POST_NOT_FOUND::asServiceException);
                
        // 비밀글 또는 팔로워 공개 게시글인 경우 접근 권한 확인
        if (post.isPrivate() && !post.getUser().getId().equals(currentUser.getId())) {
            throw ErrorStatus.USER_POST_ACCESS_DENIED.asServiceException();
        }
        
        // TODO: 팔로워 공개 게시글인 경우 팔로워 여부 확인 로직 추가 필요
        
        // 최상위 댓글(부모 댓글)만 페이징 조회
        Page<UserPostComment> parentComments = userPostCommentRepository.findParentCommentsByPostId(postId, pageable);
        
        // 모든 답글(대댓글) 조회
        List<UserPostComment> allReplies = userPostCommentRepository.findAllRepliesByPostId(postId);
        
        // 게시글 작성자 ID
        UUID postAuthorId = post.getUser().getId();
        UUID currentUserId;
        if(currentUser!=null){
            currentUserId = currentUser.getId();
        } else {
          currentUserId = null;
        }
      // DTO 변환 (각 댓글의 표시 여부 확인)
            return parentComments.map(comment -> 
                UserPostCommentDto.fromWithReplies(
                    comment, 
                    // 답글을 정렬 방식에 맞게 정렬 
                    // LATEST(최신순)은 최신생성순 (내림차순), OLDEST(오래된순)는 초기생성순 (오름차순)
                    allReplies,
                    currentUserId,
                    postAuthorId
                )
            );
    }

    @Override
    public List<UserPostCommentDto> getRepliesByCommentId(UUID commentId, WebUser currentUser) {
        // 댓글 존재 확인
        UserPostComment parentComment = userPostCommentRepository.findByIdWithAuthorAndPost(commentId)
                .orElseThrow(ErrorStatus.COMMENT_NOT_FOUND::asServiceException);
        
        // 게시글 작성자 ID 
        UUID postAuthorId = parentComment.getPost().getUser().getId();
        
        // 대댓글 목록 조회
        List<UserPostComment> replies = userPostCommentRepository.findAllRepliesByCommentId(commentId);
        
        // 기본적으로 최신순으로 정렬 (최신 생성순 - 내림차순)
        replies.sort((r1, r2) -> r2.getCreatedAt().compareTo(r1.getCreatedAt()));
        
        // DTO 변환 (각 댓글의 표시 여부 확인)
        return replies.stream()
                .map(reply -> UserPostCommentDto.from(
                        reply, 
                        isCommentVisible(reply, currentUser.getId(), postAuthorId, parentComment.getAuthor().getId()),
                        currentUser.getId()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public boolean canViewComment(UUID commentId, WebUser currentUser) {
        // 댓글 존재 확인
        UserPostComment comment = userPostCommentRepository.findByIdWithAuthorAndPost(commentId)
                .orElseThrow(ErrorStatus.COMMENT_NOT_FOUND::asServiceException);
        
        // 비밀 댓글이 아니면 누구나 볼 수 있음
        if (!comment.isPrivate()) {
            return true;
        }
        
        UUID postAuthorId = comment.getPost().getUser().getId();
        UUID parentAuthorId = comment.getParent() != null ? comment.getParent().getAuthor().getId() : null;
        
        return isCommentVisible(comment, currentUser.getId(), postAuthorId, parentAuthorId);
    }
    
    /**
     * 댓글 표시 권한 확인
     */
    private boolean isCommentVisible(
            UserPostComment comment, 
            UUID currentUserId, 
            UUID postAuthorId,
            UUID parentAuthorId) {
        
        // 삭제된 댓글은 내용이 보이지 않도록 처리
        if (comment.isDeleted()) {
            return false;
        }
        
        // 비밀 댓글이 아니면 누구나 볼 수 있음
        if (!comment.isPrivate()) {
            return true;
        }
        
        // 비밀 댓글인 경우 권한 검사
        
        // 1. 현재 사용자가 게시글 작성자인 경우
        if (currentUserId.equals(postAuthorId)) {
            return true;
        }
        
        // 2. 현재 사용자가 댓글 작성자인 경우
        if (currentUserId.equals(comment.getAuthor().getId())) {
            return true;
        }
        
        // 3. 대댓글이고 현재 사용자가 부모 댓글 작성자인 경우
        if (parentAuthorId != null && currentUserId.equals(parentAuthorId)) {
            return true;
        }
        
        // 그 외에는 볼 수 없음
        return false;
    }
}
