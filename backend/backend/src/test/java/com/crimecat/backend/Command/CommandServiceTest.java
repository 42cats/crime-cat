package com.crimecat.backend.Command;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.crimecat.backend.command.service.CommandService;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.command.domain.Command;
import com.crimecat.backend.command.repository.CommandRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;

class CommandServiceTest {

  @InjectMocks
  private CommandService service;

  @Mock
  private CommandRepository repo;

  private UUID existingId;
  private Command sample;

  @BeforeEach
  void setUp() {
    MockitoAnnotations.openMocks(this);
    existingId = UUID.randomUUID();
    sample = new Command("n", "d", "u", "c", List.of("p"), "content");
    // 강제로 id 설정
    ReflectionTestUtils.setField(sample, "id", existingId);
  }

  @Test
  void deleteCommand_성공() {
    when(repo.findById(existingId)).thenReturn(Optional.of(sample));
    // deleteById는 void → 예외 없으면 성공
    doNothing().when(repo).deleteById(existingId);

    service.deleteCommand(existingId.toString());

    verify(repo).deleteById(existingId);
  }

  @Test
  void deleteCommand_존재하지않음_404() {
    when(repo.findById(existingId)).thenReturn(Optional.empty());

    Throwable thrown = catchThrowable(() ->
        service.deleteCommand(existingId.toString())
    );

    assertThat(thrown)
        .isInstanceOfSatisfying(RuntimeException.class, ex ->
            assertThat(ex.getMessage()).contains(ErrorStatus.RESOURCE_NOT_FOUND.getMessage())
        );
  }

  @Test
  void deleteCommand_FK제약위반_400() {
    when(repo.findById(existingId)).thenReturn(Optional.of(sample));
    doThrow(DataIntegrityViolationException.class)
        .when(repo).deleteById(existingId);

    Throwable thrown = catchThrowable(() ->
        service.deleteCommand(existingId.toString())
    );

    assertThat(thrown)
        .isInstanceOfSatisfying(RuntimeException.class, ex ->
            assertThat(ex.getMessage()).contains(ErrorStatus.INVALID_PARAMETER.getMessage())
        );
  }
}
