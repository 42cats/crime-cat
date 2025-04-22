package com.crimecat.backend.web.command.controller;

import com.crimecat.backend.web.command.dto.CommandDto;
import com.crimecat.backend.web.command.dto.CommandListResponseDto;
import com.crimecat.backend.web.command.dto.CommandRequestDto;
import com.crimecat.backend.web.command.service.CommandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/commands")
@RequiredArgsConstructor
public class CommandController {

  private final CommandService commandService;
  @GetMapping("")
  public ResponseEntity<CommandListResponseDto> getCommandsList(){
    return ResponseEntity.ok(commandService.getCommandsList());
  }

  @GetMapping("{commandId}")
  public ResponseEntity<CommandDto> getCommand(@PathVariable("commandId") String commandId){
    return ResponseEntity.ok(commandService.getCommand(commandId));
  }

  @PostMapping("")
  public ResponseEntity<Void> createCommand(@RequestBody CommandRequestDto requestDto){
    commandService.createCommand(requestDto);
    return ResponseEntity.status(HttpStatus.CREATED).build();
  }

  @PatchMapping("{commandId}")
  public ResponseEntity<Void> editCommand(@RequestBody CommandRequestDto requestDto, @PathVariable("commandId") String commandId) {
    commandService.updateCommand(commandId, requestDto);
    return ResponseEntity.status(HttpStatus.ACCEPTED).build();
  }

  @DeleteMapping("{commandId}")
  public ResponseEntity<Void> deleteCommand(@PathVariable("commandId") String commandId){
    commandService.deleteCommand(commandId);
    return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
  }
}
