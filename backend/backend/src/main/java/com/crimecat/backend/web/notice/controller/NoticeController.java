package com.crimecat.backend.web.notice.controller;

import com.crimecat.backend.web.notice.dto.NoticeResponseDto;
import com.crimecat.backend.web.notice.dto.NoticeSummaryResponseDto;
import com.crimecat.backend.web.notice.dto.PageResultDto;
import com.crimecat.backend.web.notice.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/notices")
public class NoticeController {

  private final NoticeService noticeService;

  @GetMapping()
  public ResponseEntity<PageResultDto<NoticeSummaryResponseDto>> noticeSummaryResponse(
      @RequestParam(value = "limit", required = false, defaultValue = "10") Integer limit,
      @RequestParam(value = "page", required = false,defaultValue = "0") Integer page
  )
  {
    return ResponseEntity.ok().body(noticeService.getNotice(limit, page));
  }

  @GetMapping("{id}")
  public ResponseEntity<NoticeResponseDto> getNoticeDetail(@PathVariable("id") String id){
  return ResponseEntity.ok().body(noticeService.getNoticeDetail(id));
  }
}
