package com.crimecat.backend.trace;

public class TraceStatus {
    
    private final TraceId traceId;
    private final Long startTime;
    private final String message;
    
    public TraceStatus(TraceId traceId, Long startTime, String message) {
        this.traceId = traceId;
        this.startTime = startTime;
        this.message = message;
    }
    
    public TraceId getTraceId() {
        return traceId;
    }
    
    public Long getStartTime() {
        return startTime;
    }
    
    public String getMessage() {
        return message;
    }
}