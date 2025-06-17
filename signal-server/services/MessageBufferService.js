const Redis = require('ioredis');
const axios = require('axios');

class MessageBufferService {
  constructor() {
    // Redis 클라이언트 설정
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'dev_redis',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || null,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Redis 연결 이벤트 핸들링
    this.redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    this.redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });

    this.redis.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    // 배치 처리 설정
    this.BUFFER_KEY = 'chat:message_buffer';
    this.BATCH_SIZE = process.env.BATCH_SIZE || 50;
    this.BATCH_INTERVAL = process.env.BATCH_INTERVAL || 5000; // 5초
    this.MAX_RETRY_ATTEMPTS = 3;
    
    // 배치 처리 타이머
    this.batchTimer = null;
    this.isProcessing = false;

    // 서비스 시작
    this.startBatchProcessor();
  }

  /**
   * 메시지를 Redis 버퍼에 추가
   */
  async bufferMessage(message) {
    try {
      const messageData = {
        ...message,
        bufferedAt: new Date().toISOString(),
        id: this.generateMessageId()
      };

      // Redis List에 메시지 추가 (LPUSH - 왼쪽에서 추가)
      await this.redis.lpush(this.BUFFER_KEY, JSON.stringify(messageData));
      
      console.log(`📝 Message buffered: ${message.username} - ${message.content.substring(0, 50)}...`);
      
      // 버퍼 크기 확인
      const bufferSize = await this.redis.llen(this.BUFFER_KEY);
      
      // 버퍼가 너무 크면 즉시 처리
      if (bufferSize >= this.BATCH_SIZE) {
        console.log(`⚡ Buffer size (${bufferSize}) reached batch limit, triggering immediate flush`);
        this.triggerImmediateFlush();
      }

      return messageData.id;
    } catch (error) {
      console.error('❌ Error buffering message:', error);
      throw error;
    }
  }

  /**
   * 버퍼에서 메시지들을 배치로 가져와서 처리
   */
  async processBatch() {
    if (this.isProcessing) {
      console.log('⏳ Batch processing already in progress, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      // 버퍼 크기 확인
      const bufferSize = await this.redis.llen(this.BUFFER_KEY);
      
      if (bufferSize === 0) {
        console.log('📭 No messages in buffer to process');
        return;
      }

      console.log(`🔄 Processing batch of ${Math.min(bufferSize, this.BATCH_SIZE)} messages...`);

      // 배치 크기만큼 메시지 가져오기 (RPOP - 오른쪽에서 제거)
      const messages = [];
      const batchSize = Math.min(bufferSize, this.BATCH_SIZE);

      for (let i = 0; i < batchSize; i++) {
        const messageStr = await this.redis.rpop(this.BUFFER_KEY);
        if (messageStr) {
          try {
            const message = JSON.parse(messageStr);
            messages.push(message);
          } catch (parseError) {
            console.error('❌ Error parsing buffered message:', parseError);
          }
        }
      }

      if (messages.length === 0) {
        console.log('📭 No valid messages to process');
        return;
      }

      // 백엔드 API로 배치 저장
      await this.saveBatchToDatabase(messages);

      console.log(`✅ Successfully processed batch of ${messages.length} messages`);

    } catch (error) {
      console.error('❌ Error processing batch:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 메시지 배치를 데이터베이스에 저장
   */
  async saveBatchToDatabase(messages, retryCount = 0) {
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://spring-backend:8080';
      
      // 배치 저장을 위한 DTO 형태로 변환
      const batchData = messages.map(msg => ({
        userId: msg.userId,
        username: msg.username,
        content: msg.content,
        messageType: msg.messageType || 'text',
        timestamp: msg.timestamp
      }));

      const response = await axios.post(`${backendUrl}/api/v1/chat/messages/batch`, {
        messages: batchData
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': 'signal-server',
          'X-Batch-Size': messages.length.toString()
        },
        timeout: 10000 // 10초 타임아웃
      });

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Batch saved to database: ${messages.length} messages`);
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

    } catch (error) {
      console.error(`❌ Error saving batch to database (attempt ${retryCount + 1}):`, error.message);
      
      // 재시도 로직
      if (retryCount < this.MAX_RETRY_ATTEMPTS) {
        console.log(`🔄 Retrying batch save in ${(retryCount + 1) * 2} seconds...`);
        
        // 지수 백오프 (2초, 4초, 6초)
        await this.sleep((retryCount + 1) * 2000);
        
        return this.saveBatchToDatabase(messages, retryCount + 1);
      } else {
        // 최대 재시도 횟수 초과 시 메시지를 백업 큐에 저장
        console.error(`💀 Failed to save batch after ${this.MAX_RETRY_ATTEMPTS} attempts, moving to backup queue`);
        await this.moveToBackupQueue(messages);
      }
    }
  }

  /**
   * 실패한 메시지들을 백업 큐로 이동
   */
  async moveToBackupQueue(messages) {
    try {
      const backupKey = 'chat:failed_messages';
      const backupData = {
        messages,
        failedAt: new Date().toISOString(),
        retryCount: this.MAX_RETRY_ATTEMPTS
      };

      await this.redis.lpush(backupKey, JSON.stringify(backupData));
      console.log(`💾 Moved ${messages.length} failed messages to backup queue`);
    } catch (error) {
      console.error('❌ Error moving messages to backup queue:', error);
    }
  }

  /**
   * 배치 처리 스케줄러 시작
   */
  startBatchProcessor() {
    console.log(`🚀 Starting batch processor with ${this.BATCH_INTERVAL}ms interval`);
    
    this.batchTimer = setInterval(async () => {
      await this.processBatch();
    }, this.BATCH_INTERVAL);

    // 프로세스 종료 시 정리
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  /**
   * 즉시 배치 처리 트리거
   */
  triggerImmediateFlush() {
    // 디바운싱을 위해 기존 타이머가 있으면 취소
    if (this.immediateFlushTimeout) {
      clearTimeout(this.immediateFlushTimeout);
    }

    // 100ms 후 즉시 처리 (다른 메시지들과 함께 배치 처리)
    this.immediateFlushTimeout = setTimeout(async () => {
      await this.processBatch();
    }, 100);
  }

  /**
   * 버퍼 상태 조회
   */
  async getBufferStatus() {
    try {
      const bufferSize = await this.redis.llen(this.BUFFER_KEY);
      const backupSize = await this.redis.llen('chat:failed_messages');
      
      return {
        bufferSize,
        backupSize,
        isProcessing: this.isProcessing,
        batchSize: this.BATCH_SIZE,
        batchInterval: this.BATCH_INTERVAL
      };
    } catch (error) {
      console.error('❌ Error getting buffer status:', error);
      return null;
    }
  }

  /**
   * 백업 큐의 실패한 메시지들 재처리
   */
  async retryFailedMessages() {
    try {
      const backupKey = 'chat:failed_messages';
      const backupData = await this.redis.rpop(backupKey);
      
      if (!backupData) {
        console.log('📭 No failed messages to retry');
        return;
      }

      const parsed = JSON.parse(backupData);
      console.log(`🔄 Retrying ${parsed.messages.length} failed messages...`);
      
      await this.saveBatchToDatabase(parsed.messages);
    } catch (error) {
      console.error('❌ Error retrying failed messages:', error);
    }
  }

  /**
   * 메시지 ID 생성
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 유틸리티: Sleep 함수
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 서비스 종료 시 정리 작업
   */
  async shutdown() {
    console.log('🛑 Shutting down MessageBufferService...');
    
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    if (this.immediateFlushTimeout) {
      clearTimeout(this.immediateFlushTimeout);
    }

    // 남은 버퍼 메시지들을 마지막으로 처리
    await this.processBatch();
    
    // Redis 연결 종료
    await this.redis.quit();
    
    console.log('✅ MessageBufferService shutdown complete');
  }
}

module.exports = MessageBufferService;