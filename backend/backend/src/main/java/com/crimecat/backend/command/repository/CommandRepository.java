package com.crimecat.backend.command.repository;

import com.crimecat.backend.command.domain.Command;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommandRepository extends JpaRepository <Command, UUID> {

  /**
   * 캐시용 전체 명령어 조회 - author 정보 페치
   */
  @Query("SELECT c FROM Command c JOIN FETCH c.author")
  @Override
  List<Command> findAll();

  /**
   * 캐시용 명령어 상세 조회 - author 정보 페치
   */
  @Query("SELECT c FROM Command c JOIN FETCH c.author WHERE c.id = :id")
  @Override
  Optional<Command> findById(@Param("id") UUID id);

  void deleteById(UUID id);

}
