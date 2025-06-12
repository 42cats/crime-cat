package com.crimecat.backend.command.repository;

import com.crimecat.backend.command.domain.Command;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CommandRepository extends JpaRepository <Command, UUID> {

  @Override
  List<Command> findAll();

  @Override
  Optional<Command> findById(UUID uuid);

  void deleteById(UUID id);

  /**
   * 사이트맵용 명령어 조회 (최신순)
   */
  @Query("SELECT c FROM Command c ORDER BY c.createdAt DESC")
  List<Command> findTop100ByOrderByCreatedAtDesc(Pageable pageable);

}
