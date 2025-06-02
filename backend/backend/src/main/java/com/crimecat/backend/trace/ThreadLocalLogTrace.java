package com.crimecat.backend.trace;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ThreadLocalLogTrace implements LogTrace {
    
    private static final String START_PREFIX = "-->";
    private static final String COMPLETE_PREFIX = "<--";
    private static final String EX_PREFIX = "<X-";
    
    private final ThreadLocal<TraceId> traceIdHolder = new ThreadLocal<>();
    
    @Override
    public TraceStatus begin(String message) {
        syncTraceId();
        TraceId traceId = traceIdHolder.get();
        Long startTime = System.currentTimeMillis();
        
        log.info("[{}] {}{}", traceId.getId(), addSpace(START_PREFIX, traceId.getLevel()), message);
        
        return new TraceStatus(traceId, startTime, message);
    }
    
    @Override
    public void end(TraceStatus status) {
        complete(status, null);
    }
    
    @Override
    public void exception(TraceStatus status, Exception e) {
        complete(status, e);
    }
    
    private void complete(TraceStatus status, Exception e) {
        Long stopTime = System.currentTimeMillis();
        long resultTime = stopTime - status.getStartTime();
        TraceId traceId = status.getTraceId();
        
        if (e == null) {
            log.info("[{}] {}{} time={}ms", traceId.getId(), 
                    addSpace(COMPLETE_PREFIX, traceId.getLevel()), 
                    status.getMessage(), resultTime);
        } else {
            log.info("[{}] {}{} time={}ms ex={}", traceId.getId(),
                    addSpace(EX_PREFIX, traceId.getLevel()),
                    status.getMessage(), resultTime, e.toString());
        }
        
        releaseTraceId();
    }
    
    private void syncTraceId() {
        TraceId traceId = traceIdHolder.get();
        if (traceId == null) {
            traceIdHolder.set(new TraceId());
        } else {
            traceIdHolder.set(traceId.createNextId());
        }
    }
    
    private void releaseTraceId() {
        TraceId traceId = traceIdHolder.get();
        if (traceId.isFirstLevel()) {
            traceIdHolder.remove();
        } else {
            traceIdHolder.set(traceId.createPreviousId());
        }
    }
    
    private String addSpace(String prefix, int level) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < level; i++) {
            sb.append((i == level - 1) ? "|" + prefix : "|   ");
        }
        return sb.toString();
    }
}