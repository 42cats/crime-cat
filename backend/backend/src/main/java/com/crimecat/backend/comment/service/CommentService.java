package com.crimecat.backend.comment.service;

import com.crimecat.backend.comment.domain.Comment;
import com.crimecat.backend.comment.domain.CommentLike;
import com.crimecat.backend.comment.dto.CommentRequest;
import com.crimecat.backend.comment.dto.CommentResponse;
import com.crimecat.backend.comment.repository.CommentLikeRepository;
import com.crimecat.backend.comment.repository.CommentRepository;
import com.crimecat.backend.comment.sort.CommentSortType;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.gametheme.repository.GameThemeRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final GameThemeRepository gameThemeRepository;
    private final GameHistoryRepository gameHistoryRepository;
    private final WebUserRepository webUserRepository;
    
    // 댓글 작성
    @Transactional
    public CommentResponse createComment(UUID gameThemeId, UUID userId, CommentRequest request) {
    GameTheme gameTheme = gameThemeRepository.findById(gameThemeId)
    .orElseThrow(ErrorStatus.GAME_THEME_NOT_FOUND::asServiceException);
    
    // 디버그 로그: 스포일러 값 확인
    log.info("CommentRequest isSpoiler 값: {}", request.isSpoiler());
    
        // 사용자 정보 조회
    WebUser author = webUserRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

    // author 객체를 전달하여 댓글 생성
    Comment comment = Comment.from(gameThemeId, userId, request, author);
    
    // 디버그 로그: Comment 객체의 isSpoiler 값 확인
    log.info("Comment isSpoiler 값: {}", comment.isSpoiler());

    Comment savedComment = commentRepository.save(comment);
    
        // 대댓글이 아닌 경우만 빈 replies 목록 생성
        List<CommentResponse> replies = new ArrayList<>();
        
        boolean canViewSpoiler = hasPlayedGameTheme(userId, gameThemeId);
        
        CommentResponse response = CommentResponse.from(savedComment, false, true, canViewSpoiler, replies);
        log.info("CommentResponse isSpoiler 값: {}", response.isSpoiler());
        
        return response;
    }
    
    // 댓글 수정
    @Transactional
    public CommentResponse updateComment(UUID commentId, UUID userId, CommentRequest request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다"));
        
        // 댓글 작성자 본인만 수정 가능
        if (!comment.getAuthorId().equals(userId)) {
            throw new AccessDeniedException("댓글을 수정할 권한이 없습니다");
        }
        
        comment.update(request.getContent(), request.isSpoiler());
        Comment updatedComment = commentRepository.save(comment);
        
        // 대댓글 목록 가져오기
        List<CommentResponse> replies = new ArrayList<>();
        if (comment.getParentId() == null) {
            replies = getCommentReplies(commentId, userId, CommentSortType.OLDEST);
        }
        
        boolean isLiked = commentLikeRepository.existsByUser_IdAndComment_Id(userId, commentId);
        log.info("like me ={}", isLiked);
        boolean canViewSpoiler = hasPlayedGameTheme(userId, comment.getGameThemeId());
        
        return CommentResponse.from(updatedComment, isLiked, true, canViewSpoiler, replies);
    }
    
    // 댓글 삭제
    @Transactional
    public void deleteComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다"));
        
        // 댓글 작성자 본인만 삭제 가능
        if (!comment.getAuthorId().equals(userId)) {
            throw new AccessDeniedException("댓글을 삭제할 권한이 없습니다");
        }
        
        comment.delete();
        commentRepository.save(comment);
        
        // 대댓글도 함께 삭제 처리
        if (comment.getParentId() == null) {
            List<Comment> replies = commentRepository.findByParentIdAndIsDeletedFalse(commentId, Sort.by(Sort.Direction.ASC, "createdAt"));
            for (Comment reply : replies) {
                reply.delete();
                commentRepository.save(reply);
            }
        }
    }
    
    // 댓글 목록 조회 (SortType을 통한 정렬 옵션 적용)
    @Transactional(readOnly = true)
    public Page<CommentResponse> getComments(UUID gameThemeId, UUID userId, int page, int size, CommentSortType sortType) {
        Pageable pageable = PageRequest.of(page, size, sortType.getSort());
        Page<Comment> comments = commentRepository.findByGameThemeIdAndParentIdIsNullAndIsDeletedFalse(
                gameThemeId, pageable);
        
        boolean canViewSpoiler = hasPlayedGameTheme(userId, gameThemeId);
        
        return comments.map(comment -> {
            boolean isLiked = commentLikeRepository.existsByUser_IdAndComment_Id(userId, comment.getId());
            log.info("like me ={}", isLiked);
            boolean isOwnComment = comment.getAuthorId().equals(userId);
            List<CommentResponse> replies = getCommentReplies(comment.getId(), userId, CommentSortType.OLDEST);
            
            return CommentResponse.from(comment, isLiked, isOwnComment, canViewSpoiler, replies);
        });
    }
    
    // 비로그인 사용자를 위한 댓글 목록 조회 (스포일러 아닌 댓글만 표시)
    @Transactional(readOnly = true)
    public Page<CommentResponse> getPublicComments(UUID gameThemeId, int page, int size, CommentSortType sortType) {
        Pageable pageable = PageRequest.of(page, size, sortType.getSort());
        Page<Comment> comments = commentRepository.findByGameThemeIdAndParentIdIsNullAndIsDeletedFalse(
                gameThemeId, pageable);
        
        // 비로그인 사용자는 스포일러 내용을 볼 수 없음
        boolean canViewSpoiler = false;
        
        return comments.map(comment -> {
            // 비로그인 사용자는 항상 좋아요를 누르지 않은 상태
            boolean isLiked = false;
            // 비로그인 사용자는 항상 자신의 댓글이 아님
            boolean isOwnComment = false;
            
            // 대댓글 처리 - 스포일러 아닌 대댓글만 반환
            List<CommentResponse> replies = getPublicCommentReplies(comment.getId(), CommentSortType.OLDEST);
            
            return CommentResponse.from(comment, isLiked, isOwnComment, canViewSpoiler, replies);
        });
    }
    
    // 대댓글 조회
    private List<CommentResponse> getCommentReplies(UUID commentId, UUID userId, CommentSortType sortType) {
        List<Comment> replies = commentRepository.findByParentIdAndIsDeletedFalse(commentId, sortType.getSort());
        List<CommentResponse> replyResponses = new ArrayList<>();
        
        for (Comment reply : replies) {
            boolean isLiked = commentLikeRepository.existsByUser_IdAndComment_Id(userId, reply.getId());
            boolean isOwnReply = reply.getAuthorId().equals(userId);
            boolean canViewSpoiler = hasPlayedGameTheme(userId, reply.getGameThemeId());
            
            replyResponses.add(CommentResponse.from(reply, isLiked, isOwnReply, canViewSpoiler, new ArrayList<>()));
        }
        
        return replyResponses;
    }
    
    // 비로그인 사용자를 위한 대댓글 조회 (스포일러 아닌 내용만)
    private List<CommentResponse> getPublicCommentReplies(UUID commentId, CommentSortType sortType) {
        List<Comment> replies = commentRepository.findByParentIdAndIsDeletedFalse(commentId, sortType.getSort());
        List<CommentResponse> replyResponses = new ArrayList<>();
        
        for (Comment reply : replies) {
            // 비로그인 사용자 설정
            boolean isLiked = false;
            boolean isOwnReply = false;
            boolean canViewSpoiler = false; // 스포일러 내용을 볼 수 없음
            
            replyResponses.add(CommentResponse.from(reply, isLiked, isOwnReply, canViewSpoiler, new ArrayList<>()));
        }
        
        return replyResponses;
    }
    
    // 댓글 좋아요
    @Transactional
    public void likeComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다"));
        
        boolean exists = commentLikeRepository.existsByUser_IdAndComment_Id(userId, commentId);
        
        if (!exists) {
            CommentLike commentLike = CommentLike.from(commentId, userId);

            commentLikeRepository.save(commentLike);
            comment.incrementLikes();
            commentRepository.save(comment);
        }
    }
    
    // 댓글 좋아요 취소
    @Transactional
    public void unlikeComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다"));
        
        Optional<CommentLike> commentLike = commentLikeRepository.findByUserIdAndCommentId(userId, commentId);
        
        if (commentLike.isPresent()) {
            commentLikeRepository.delete(commentLike.get());
            comment.decrementLikes();
            commentRepository.save(comment);
        }
    }
    
    // 해당 게임 테마를 플레이했는지 확인 (스포일러 표시 여부 결정)
    private boolean hasPlayedGameTheme(UUID webUserId, UUID gameThemeId) {
        // userId가 null이면 (비로그인 사용자) 게임을 플레이하지 않은 것으로 간주
        if (webUserId == null) {
            return false;
        }
        // GameHistory를 통해 확인
        return gameHistoryRepository.existsByDiscordUserIdAndGameThemeId(webUserId, gameThemeId);
    }
}