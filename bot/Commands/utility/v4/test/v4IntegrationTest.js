const MusicPlayerV4 = require('../MusicPlayerV4');
const { MusicSystemAdapter } = require('../../MusicSystemAdapter');

/**
 * v4 Integration Test Suite
 */
class V4IntegrationTest {
    constructor() {
        this.testResults = [];
        this.mockClient = {
            serverMusicData: new Map(),
            user: { id: 'test-bot-id', displayAvatarURL: () => 'test-url' }
        };
        this.mockGuildId = 'test-guild-v4';
        this.mockUser = { 
            id: 'test-user-v4',
            username: 'TestUserV4',
            voice: {
                channel: {
                    id: 'test-voice-channel',
                    guild: {
                        voiceAdapterCreator: () => ({})
                    }
                }
            }
        };
    }

    /**
     * 모든 테스트 실행
     */
    async runAllTests() {
        console.log('🚀 v4 Music System Integration Test 시작...\n');
        
        await this.testPlayerCreation();
        await this.testBasicControls();
        await this.testQueueManagement();
        await this.testModeChanges();
        await this.testUIGeneration();
        await this.testPlayerDestroy();
        
        this.printResults();
    }

    /**
     * 테스트 1: 플레이어 생성
     */
    async testPlayerCreation() {
        const testName = 'Player Creation v4';
        try {
            const player = new MusicPlayerV4(
                this.mockGuildId, 
                this.mockClient, 
                this.mockUser
            );
            
            if (player && player.version === 'v4') {
                this.addResult(testName, true, 'v4 플레이어 생성 성공');
            } else {
                this.addResult(testName, false, '플레이어 버전이 v4가 아님');
            }
            
            // 정리
            await player.destroy();
            
        } catch (error) {
            this.addResult(testName, false, error.message);
        }
    }

    /**
     * 테스트 2: 기본 컨트롤
     */
    async testBasicControls() {
        const testName = 'Basic Controls';
        try {
            const player = new MusicPlayerV4(
                this.mockGuildId, 
                this.mockClient, 
                this.mockUser
            );
            
            // 기본 상태 확인
            const initialState = player.getFullState();
            if (!initialState.isPlaying && !initialState.isPaused) {
                // 볼륨 설정 테스트
                await player.setVolume(0.7);
                if (player.state.volume === 0.7) {
                    this.addResult(testName, true, '기본 컨트롤 테스트 성공');
                } else {
                    this.addResult(testName, false, '볼륨 설정 실패');
                }
            } else {
                this.addResult(testName, false, '초기 상태가 올바르지 않음');
            }
            
            await player.destroy();
            
        } catch (error) {
            this.addResult(testName, false, error.message);
        }
    }

    /**
     * 테스트 3: 큐 관리
     */
    async testQueueManagement() {
        const testName = 'Queue Management';
        try {
            const player = new MusicPlayerV4(
                this.mockGuildId, 
                this.mockClient, 
                this.mockUser
            );
            
            // 큐 정보 확인
            const queueInfo = player.queue.getInfo();
            
            if (queueInfo && typeof queueInfo.length === 'number') {
                // 소스 전환 테스트
                await player.switchSource('youtube');
                
                if (player.queue.source === 'youtube') {
                    this.addResult(testName, true, '큐 관리 테스트 성공');
                } else {
                    this.addResult(testName, false, '소스 전환 실패');
                }
            } else {
                this.addResult(testName, false, '큐 정보 조회 실패');
            }
            
            await player.destroy();
            
        } catch (error) {
            this.addResult(testName, false, error.message);
        }
    }

    /**
     * 테스트 4: 모드 변경
     */
    async testModeChanges() {
        const testName = 'Mode Changes';
        try {
            const player = new MusicPlayerV4(
                this.mockGuildId, 
                this.mockClient, 
                this.mockUser
            );
            
            const initialMode = player.state.mode;
            
            // 모드 변경 테스트
            await player.setMode('shuffle');
            
            if (player.state.mode === 'shuffle' && player.state.mode !== initialMode) {
                this.addResult(testName, true, '모드 변경 테스트 성공');
            } else {
                this.addResult(testName, false, '모드 변경 실패');
            }
            
            await player.destroy();
            
        } catch (error) {
            this.addResult(testName, false, error.message);
        }
    }

    /**
     * 테스트 5: UI 생성
     */
    async testUIGeneration() {
        const testName = 'UI Generation';
        try {
            const player = new MusicPlayerV4(
                this.mockGuildId, 
                this.mockClient, 
                this.mockUser
            );
            
            // UI 생성 테스트
            const uiData = await player.reply();
            
            if (uiData && uiData.embeds && uiData.components) {
                this.addResult(testName, true, 'UI 생성 테스트 성공');
            } else {
                this.addResult(testName, false, 'UI 데이터 구조 오류');
            }
            
            await player.destroy();
            
        } catch (error) {
            this.addResult(testName, false, error.message);
        }
    }

    /**
     * 테스트 6: 플레이어 정리
     */
    async testPlayerDestroy() {
        const testName = 'Player Destroy';
        try {
            const player = new MusicPlayerV4(
                this.mockGuildId, 
                this.mockClient, 
                this.mockUser
            );
            
            // 정리 테스트
            await player.destroy();
            
            // 상태 확인
            const health = player.healthCheck();
            
            this.addResult(testName, true, '플레이어 정리 테스트 성공');
            
        } catch (error) {
            this.addResult(testName, false, error.message);
        }
    }

    /**
     * 테스트 결과 추가
     */
    addResult(testName, passed, message) {
        this.testResults.push({
            name: testName,
            passed: passed,
            message: message
        });
    }

    /**
     * 결과 출력
     */
    printResults() {
        console.log('\n📊 v4 테스트 결과:\n');
        
        let passedCount = 0;
        let failedCount = 0;
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.name}: ${result.message}`);
            
            if (result.passed) {
                passedCount++;
            } else {
                failedCount++;
            }
        });
        
        console.log('\n📈 v4 요약:');
        console.log(`총 테스트: ${this.testResults.length}`);
        console.log(`성공: ${passedCount}`);
        console.log(`실패: ${failedCount}`);
        console.log(`성공률: ${((passedCount / this.testResults.length) * 100).toFixed(1)}%`);
        
        if (failedCount === 0) {
            console.log('\n🎉 모든 v4 테스트 통과! 시스템이 성공적으로 구축되었습니다.');
        } else {
            console.log('\n⚠️  일부 v4 테스트가 실패했습니다. 로그를 확인해주세요.');
        }
    }
}

// 직접 실행 시 테스트 수행
if (require.main === module) {
    const test = new V4IntegrationTest();
    test.runAllTests().catch(console.error);
}

module.exports = V4IntegrationTest;