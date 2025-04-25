package com.crimecat.backend.web.command.controller;

import com.crimecat.backend.web.command.dto.CommandDto;
import com.crimecat.backend.web.command.dto.CommandSummaryDto;
import com.crimecat.backend.web.command.service.CommandService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/public/commands")
@RequiredArgsConstructor
public class CommandController {

  private final CommandService commandService;
  @GetMapping("")
  public ResponseEntity<List<CommandSummaryDto>> getCommandsList(){
    return ResponseEntity.ok(commandService.getCommandsList());
  }

  @GetMapping("{commandId}")
  public ResponseEntity<CommandDto> getCommand(@PathVariable("commandId") String commandId){
    return ResponseEntity.ok(commandService.getCommand(commandId));
  }
}
