/**
 * 음악 플레이어 상태 관리 머신
 * 모든 재생 상태와 사용자 액션을 통합 관리
 */

const { AudioPlayerStatus } = require('@discordjs/voice');

class MusicPlayerStateMachine {
    constructor(urlManager) {
        this.urlManager = urlManager;
        this.state = 'IDLE'; // IDLE, PLAYING, TRANSITIONING
        this.isProcessing = false; // 작업 진행 중 플래그
        this.operationQueue = []; // 대기 중인 작업 큐
        this.currentOperation = null; // 현재 진행 중인 작업 타입
        this.playerListenerAttached = false; // 리스너 부착 상태
    }

    /**
     * 안전한 작업 실행 (동시 실행 방지)
     */
    async executeOperation(operation) {
        if (this.isProcessing) {
            // 이미 처리 중이면 큐에 추가
            return new Promise((resolve) => {
                this.operationQueue.push({ operation, resolve });
            });
        }

        this.isProcessing = true;
        
        try {
            const result = await operation();
            return result;
        } finally {
            this.isProcessing = false;
            // 대기 중인 작업 처리
            this.processQueue();
        }
    }

    /**
     * 대기 큐 처리
     */
    async processQueue() {
        if (this.operationQueue.length > 0 && !this.isProcessing) {
            const { operation, resolve } = this.operationQueue.shift();
            const result = await this.executeOperation(operation);
            resolve(result);
        }
    }

    /**
     * 다음곡 이동 (통합)
     */
    async next() {
        return this.executeOperation(async () => {
            console.log("[STATE] Next button - current state:", this.state);
            this.currentOperation = 'MANUAL_NEXT';
            
            // 현재 재생 중이면 정지
            if (this.state === 'PLAYING') {
                await this.stopCurrent();
            }

            // 인덱스 이동
            const nextIndex = (this.urlManager.playlistManager.currentIndex + 1) % 
                            this.urlManager.playlistManager.playlist.length;
            
            // 새 곡 재생
            await this.playTrack(nextIndex);
            
            console.log("[STATE] Next completed - new index:", nextIndex);
            this.currentOperation = null;
        });
    }

    /**
     * 이전곡 이동 (통합)
     */
    async prev() {
        return this.executeOperation(async () => {
            console.log("[STATE] Prev button - current state:", this.state);
            this.currentOperation = 'MANUAL_PREV';
            
            // 현재 재생 중이면 정지
            if (this.state === 'PLAYING') {
                await this.stopCurrent();
            }

            // 인덱스 이동
            const prevIndex = (this.urlManager.playlistManager.currentIndex - 1 + 
                             this.urlManager.playlistManager.playlist.length) % 
                             this.urlManager.playlistManager.playlist.length;
            
            // 새 곡 재생
            await this.playTrack(prevIndex);
            
            console.log("[STATE] Prev completed - new index:", prevIndex);
            this.currentOperation = null;
        });
    }

    /**
     * 자동 진행 (곡 끝남)
     */
    async autoAdvance() {
        return this.executeOperation(async () => {
            console.log("[STATE] Auto advance - playMode:", this.urlManager.playlistManager.playMode);
            this.currentOperation = 'AUTO_ADVANCE';
            
            const { playMode } = this.urlManager.playlistManager;
            const { REPEATONE, ONCE, NOMAL, SHUFFLE } = require('./PlaylistManager');

            if (playMode === REPEATONE) {
                // 같은 곡 반복
                await this.playTrack(this.urlManager.playlistManager.currentIndex);
            } else if (playMode === ONCE) {
                // 정지
                this.state = 'IDLE';
            } else if (playMode === NOMAL || playMode === SHUFFLE) {
                // 다음곡으로
                const nextIndex = (this.urlManager.playlistManager.currentIndex + 1) % 
                                this.urlManager.playlistManager.playlist.length;
                await this.playTrack(nextIndex);
            }
            
            this.currentOperation = null;
        });
    }

    /**
     * 현재 재생 정지
     */
    async stopCurrent() {
        if (this.urlManager.audioPlayerManager.player?.state.status === AudioPlayerStatus.Playing ||
            this.urlManager.audioPlayerManager.player?.state.status === AudioPlayerStatus.Buffering) {
            
            console.log("[STATE] Stopping current track - operation:", this.currentOperation);
            this.state = 'TRANSITIONING';
            
            // 이벤트 리스너 제거 (중요!)
            this.urlManager.audioPlayerManager.player.removeAllListeners("stateChange");
            this.playerListenerAttached = false;
            
            await this.urlManager.audioPlayerManager.stop();
            
            // 완전 정지 대기
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    /**
     * 일시정지/재개
     */
    async pause() {
        return this.executeOperation(async () => {
            await this.urlManager.audioPlayerManager.pause();
        });
    }

    async resume() {
        return this.executeOperation(async () => {
            this.urlManager.audioPlayerManager.resume();
        });
    }

    /**
     * 완전 정지
     */
    async stop() {
        return this.executeOperation(async () => {
            await this.stopCurrent();
            this.state = 'IDLE';
        });
    }

    /**
     * 트랙 재생
     */
    async playTrack(index) {
        this.state = 'TRANSITIONING';
        
        try {
            // 음성 채널 연결 확인
            if (!this.urlManager.audioPlayerManager.isInVoiceChannel()) {
                await this.urlManager.audioPlayerManager.join(this.urlManager.operator);
            }
            
            if (this.urlManager.playlistManager.playlist.length === 0) {
                throw new Error("재생목록이 없습니다!");
            }
            
            // 인덱스 업데이트
            this.urlManager.playlistManager.currentIndex = index;
            
            // 재생 시작 (Raw 호출 - 콜백 없음)
            const track = this.urlManager.playlistManager.getByIndex(index);
            console.log("[STATE] Playing track:", track?.url, "at index:", index, "operation:", this.currentOperation);
            
            await this.urlManager.audioPlayerManager.playRaw(track);
            
            // StateMachine에서 직접 이벤트 리스너 등록 (한 번만)
            if (!this.playerListenerAttached) {
                this.setupPlayerListener();
            }
            
        } catch (e) {
            this.state = 'IDLE';
            throw e;
        }
    }

    /**
     * 플레이어 이벤트 리스너 설정 (StateMachine 전용)
     */
    setupPlayerListener() {
        const player = this.urlManager.audioPlayerManager.player;
        
        // 기존 리스너 제거
        player.removeAllListeners("stateChange");
        this.playerListenerAttached = true;
        
        // StateMachine 전용 리스너 등록
        player.on("stateChange", async (oldState, newState) => {
            console.log("[STATE] Player state changed:", oldState.status, "→", newState.status, 
                       "| Machine state:", this.state, "| Operation:", this.currentOperation);
            
            if (newState.status === AudioPlayerStatus.Playing && this.state === 'TRANSITIONING') {
                this.state = 'PLAYING';
                console.log("[STATE] Now playing");
                
                // UI 업데이트
                if (this.urlManager.interactionMsg) {
                    const componentData = await this.urlManager.reply();
                    await this.urlManager.interactionMsg.edit(componentData);
                }
                
            } else if (newState.status === AudioPlayerStatus.Idle && this.state === 'PLAYING') {
                // 수동 작업 중이면 자동 진행하지 않음
                if (this.currentOperation === 'MANUAL_NEXT' || this.currentOperation === 'MANUAL_PREV') {
                    console.log("[STATE] Manual operation in progress - ignoring natural end");
                    this.state = 'IDLE';
                } else {
                    console.log("[STATE] Track naturally ended, auto-advancing");
                    this.state = 'IDLE';
                    
                    // 자동 진행
                    await this.autoAdvance();
                }
                
            } else if (newState.status === AudioPlayerStatus.Idle) {
                console.log("[STATE] Idle during transition - ignoring");
            }
        });
    }

    /**
     * 상태 확인
     */
    getState() {
        return {
            state: this.state,
            isProcessing: this.isProcessing,
            queueLength: this.operationQueue.length,
            currentIndex: this.urlManager.playlistManager.currentIndex
        };
    }
}

module.exports = { MusicPlayerStateMachine };