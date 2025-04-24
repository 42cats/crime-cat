package com.crimecat.backend.web.admin.repository;


import com.crimecat.backend.web.admin.domain.Notice;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeRepository extends JpaRepository<Notice, UUID> {

}
