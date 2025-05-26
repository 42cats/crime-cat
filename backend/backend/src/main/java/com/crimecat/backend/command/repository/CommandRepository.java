package com.crimecat.backend.command.repository;

import com.crimecat.backend.command.domain.Command;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommandRepository extends JpaRepository <Command, UUID> {

  void deleteById(UUID id);

}
