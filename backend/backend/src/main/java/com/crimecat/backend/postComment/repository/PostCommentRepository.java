package com.crimecat.backend.postComment.repository;

import com.crimecat.backend.comment.domain.Comment;
import com.crimecat.backend.postComment.domain.PostComment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostCommentRepository extends JpaRepository<PostComment, UUID> {

    List<PostComment> findAllByPostIdAndParentIdIsNull(UUID postId, Sort sort);

    List<PostComment> findByParentId(UUID commentId, Sort sort);
}
