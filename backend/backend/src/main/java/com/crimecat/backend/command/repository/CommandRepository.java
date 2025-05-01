package com.crimecat.backend.command.repository;

import com.crimecat.backend.command.domain.Command;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommandRepository extends JpaRepository <Command, UUID> {

  @Override
  List<Command> findAll();

  @Override
  Optional<Command> findById(UUID uuid);

  void deleteById(UUID id);

}
