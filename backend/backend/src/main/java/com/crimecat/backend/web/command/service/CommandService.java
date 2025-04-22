package com.crimecat.backend.web.command.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.web.command.domain.Command;
import com.crimecat.backend.web.command.dto.CommandDto;
import com.crimecat.backend.web.command.dto.CommandRequestDto;
import com.crimecat.backend.web.command.dto.CommandSummaryDto;
import com.crimecat.backend.web.command.repository.CommandRepository;
import jakarta.persistence.PersistenceException;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommandService {
  private final CommandRepository commandRepository;

  public List<CommandSummaryDto> getCommandsList() {
    List<Command> allCommands =
        commandRepository.findAll(
            Sort.by(Sort.Direction.DESC, "updatedAt", "createdAt")); // 업데이트 최신순 등록날짜 최신순
    // ISO zone 타임으로 반환
    return allCommands.stream()
        .map(
            v ->
                CommandSummaryDto.builder()
                    .id(v.getId().toString())
                    .name(v.getName())
                    .description(v.getDescription())
                    .usage(v.getUsage())
                    .category(v.getCategory())
                    .createdAt(v.getCreatedAt().toInstant(ZoneOffset.UTC)) // ISO zone 타임으로 반환
                    .updatedAt(v.getUpdatedAt().toInstant(ZoneOffset.UTC))
                    .build())
        .toList();
  }

  public CommandDto getCommand(String commandId) {
    Command command =
        commandRepository
            .findById(UUID.fromString(commandId))
            .orElseThrow(ErrorStatus.RESOURCE_NOT_FOUND::asServiceException);
    return CommandDto.builder()
        .id(command.getId().toString())
        .name(command.getName())
        .description(command.getDescription())
        .usage(command.getUsage())
        .category(command.getCategory())
        .requiredPermissions(command.getRequiredPermissions())
        .content(command.getContent())
        .createdAt(command.getCreatedAt().toInstant(ZoneOffset.UTC))
        .updatedAt(command.getUpdatedAt().toInstant(ZoneOffset.UTC))
        .build();
  }

  @Transactional
  public void createCommand(CommandRequestDto requestDto) {
    try {
      Command newCommand =
          new Command(
              requestDto.getName(),
              requestDto.getDescription(),
              requestDto.getUsage(),
              requestDto.getCategory(),
              requestDto.getRequiredPermissions(),
              requestDto.getContent());
      commandRepository.save(newCommand);

    } catch (DataIntegrityViolationException e) {
      // 예: name 컬럼 unique 제약 위반
      throw ErrorStatus.INVALID_PARAMETER.asServiceException();
    } catch (JpaSystemException | PersistenceException e) {
      // JPA 레벨에서 발생할 수 있는 기타 예외
      throw ErrorStatus.INTERNAL_ERROR.asServiceException();
    }
  }

  @Transactional
  public void updateCommand(String commandId, CommandRequestDto requestDto) {
    try {
      // 1) 기존 엔티티 조회 (없으면 404)
      Command command =
          commandRepository
              .findById(UUID.fromString(commandId))
              .orElseThrow(ErrorStatus.RESOURCE_NOT_FOUND::asServiceException);

      // 2) 필드 업데이트
      command.setName(requestDto.getName());
      command.setDescription(requestDto.getDescription());
      command.setUsage(requestDto.getUsage());
      command.setCategory(requestDto.getCategory());
      command.setRequiredPermissions(requestDto.getRequiredPermissions());
      command.setContent(requestDto.getContent());

      // 3) 저장 (dirty‑check 작동하므로 save() 생략 가능하지만, 명시적으로 호출해도 무방)
      commandRepository.save(command);

    } catch (DataIntegrityViolationException e) {
      // 예: name unique 제약 위반 등
      throw ErrorStatus.INVALID_PARAMETER.asServiceException();
    } catch (JpaSystemException | PersistenceException e) {
      // JPA/DB 레벨 오류
      throw ErrorStatus.INTERNAL_ERROR.asServiceException();
    }
  }

  @Transactional
  public void deleteCommand(String commandId) {
    try {
      UUID id = UUID.fromString(commandId);
      // 1) 존재 여부 체크
      commandRepository
          .findById(id)
          .orElseThrow(ErrorStatus.RESOURCE_NOT_FOUND::asServiceException);

      // 2) 삭제 (기본 JPA 메서드 호출)
      commandRepository.deleteById(id);

    } catch (DataIntegrityViolationException e) {
      throw ErrorStatus.INVALID_PARAMETER.asServiceException();
    } catch (PersistenceException e) {
      throw ErrorStatus.INTERNAL_ERROR.asServiceException();
    }
  }
}
