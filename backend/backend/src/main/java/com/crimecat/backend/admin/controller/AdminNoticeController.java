package com.crimecat.backend.admin.controller;

import com.crimecat.backend.notice.dto.NoticeReorderRequestDto;
import com.crimecat.backend.notice.dto.NoticeRequestDto;
import com.crimecat.backend.admin.service.AdminService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/admin")
public class AdminNoticeController {

  private final AdminService adminService;

  @PostMapping("/notices")
  public ResponseEntity<Void> addNotice(@RequestBody NoticeRequestDto noticeRequestDto){
    adminService.addNotice(noticeRequestDto);
    return ResponseEntity.status(HttpStatus.CREATED).build();
  }

  @PatchMapping("/notices/{id}")
  public ResponseEntity<Void> editNotice(@PathVariable("id") String id, @RequestBody NoticeRequestDto noticeRequestDto){
    adminService.patchNotice(UUID.fromString(id), noticeRequestDto);
    return ResponseEntity.status(HttpStatus.ACCEPTED).build();
  }
  @DeleteMapping("/notices/{id}")
  public ResponseEntity<Void> deleteNotice(@PathVariable("id") String id){
    adminService.deleteNotice(UUID.fromString(id));
    return ResponseEntity.status(HttpStatus.ACCEPTED).build();
  }

  @PatchMapping("/notices/reorder")
  public ResponseEntity<Void> reorderNotice(@RequestBody List<NoticeReorderRequestDto> noticeReorderRequestDtoList){
    adminService.reorderNotice(noticeReorderRequestDtoList);
    return ResponseEntity.status(HttpStatus.ACCEPTED).build();
  }

}
