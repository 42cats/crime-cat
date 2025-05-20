package com.crimecat.backend.userPost.repository;

import com.crimecat.backend.userPost.domain.UserPost;
import com.crimecat.backend.userPost.domain.UserPostImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserPostImageRepository extends JpaRepository<UserPostImage, UUID> {

    void deleteByPost(UserPost post);
}
