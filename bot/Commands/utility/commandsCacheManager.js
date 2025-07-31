const redisManager = require('./redis');

/**
 * 봇 커맨드 메타데이터 캐시 관리자
 * Discord 봇의 로드된 커맨드들을 Redis에 무제한 캐시하여 
 * Spring Boot 백엔드에서 조회할 수 있도록 함
 * 
 * 캐시 정책:
 * - TTL: 무제한 (봇 재시작 시에만 갱신)
 * - 봇 시작 시 기존 캐시 삭제 후 새로 생성
 * - 커맨드는 봇 재시작 전까지 변경되지 않으므로 효율적
 */
class CommandsCacheManager {
    constructor() {
        this.CACHE_KEY = 'bot:commands:metadata';
        this.CACHE_TTL = 0; // 무제한 (봇 재시작 시에만 갱신)
        this.botVersion = process.env.BOT_VERSION || '1.0.0';
    }

    /**
     * 클라이언트의 모든 커맨드를 스캔하여 Redis에 캐시
     * @param {Client} client Discord 클라이언트
     * @returns {boolean} 성공 여부
     */
    async updateCommandsCache(client) {
        try {
            console.log('🔄 [CommandsCache] 커맨드 메타데이터 업데이트 시작');
            
            // Redis 연결 상태 확인
            console.log('🔍 [CommandsCache] Redis 연결 상태 확인 중...');
            const redisConnected = redisManager.client && redisManager.client.isOpen;
            console.log(`📡 [CommandsCache] Redis 연결 상태: ${redisConnected ? '연결됨' : '연결되지 않음'}`);
            
            if (!redisConnected) {
                console.error('❌ [CommandsCache] Redis가 연결되지 않음. 캐시 업데이트 중단');
                return false;
            }
            
            // 클라이언트 상태 확인
            console.log('🔍 [CommandsCache] 클라이언트 커맨드 상태 확인 중...');
            console.log(`📊 [CommandsCache] 슬래시 커맨드 수: ${client.slashCommands?.size || 0}`);
            console.log(`📊 [CommandsCache] 프리픽스 커맨드 수: ${client.prefixCommands?.size || 0}`);
            
            // 기존 캐시 삭제 (봇 재시작 시 새로운 데이터로 갱신)
            const existingCache = await redisManager.exists(this.CACHE_KEY);
            console.log(`🔍 [CommandsCache] 기존 캐시 존재 여부: ${existingCache}`);
            if (existingCache) {
                await redisManager.delete(this.CACHE_KEY);
                console.log('🗑️ [CommandsCache] 기존 캐시 삭제 완료');
            }
            
            const commands = this.extractCommandsMetadata(client);
            console.log(`🔍 [CommandsCache] 추출된 커맨드 수: ${commands.length}`);
            
            const cacheData = {
                lastUpdated: new Date().toISOString(),
                botVersion: this.botVersion,
                commandCount: commands.length,
                commands: commands,
                botStartTime: new Date().toISOString() // 봇 시작 시간 추가
            };

            // BigInt 직렬화를 위한 JSON 변환
            console.log(`💾 [CommandsCache] BigInt 직렬화 처리 중...`);
            const serializedData = JSON.parse(JSON.stringify(cacheData, (_, value) => {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                return value;
            }));
            
            // Redis에 무제한 저장 (TTL = 0)
            console.log(`💾 [CommandsCache] Redis에 데이터 저장 중... (키: ${this.CACHE_KEY})`);
            await redisManager.setValue(serializedData, this.CACHE_TTL, this.CACHE_KEY);
            
            // 저장 확인
            const savedData = await redisManager.getValue(this.CACHE_KEY);
            console.log(`✅ [CommandsCache] 저장 확인: ${savedData ? '성공' : '실패'}`);
            
            console.log(`✅ [CommandsCache] 커맨드 캐시 업데이트 완료: ${commands.length}개 커맨드 (무제한 저장)`);
            console.log(`📝 [CommandsCache] 캐시된 커맨드들: ${commands.map(c => c.name).join(', ')}`);
            
            // Spring 백엔드에 캐시 갱신 알림 (선택적)
            await this.notifyBackendCacheUpdate();
            
            return true;
        } catch (error) {
            console.error('❌ [CommandsCache] 커맨드 캐시 업데이트 실패:', error);
            console.error('❌ [CommandsCache] 상세 오류:', error.stack);
            return false;
        }
    }

    /**
     * 커맨드가 캐시 대상인지 확인
     * @param {Object} command 커맨드 객체
     * @returns {boolean} 캐시 대상 여부
     */
    isCacheableCommand(command) {
        // 1. isCacheCommand가 명시적으로 false면 제외
        if (command.isCacheCommand === false) {
            console.log(`🚫 [CommandsCache] 커맨드 제외 (isCacheCommand: false): ${command.name || command.data?.name}`);
            return false;
        }
        
        // 2. isCacheCommand가 true면 포함
        if (command.isCacheCommand === true) {
            console.log(`✅ [CommandsCache] 커맨드 포함 (isCacheCommand: true): ${command.name || command.data?.name}`);
            return true;
        }
        
        // 3. permissionLevel 기반 필터링
        const permissionLevel = command.permissionLevel;
        const allowedPermissions = [
            8388608, // PermissionFlagsBits.DeafenMembers
            8        // PermissionFlagsBits.Administrator
        ];
        
        const isAllowed = allowedPermissions.includes(Number(permissionLevel));
        const cmdName = command.name || command.data?.name;
        
        if (isAllowed) {
            console.log(`✅ [CommandsCache] 커맨드 포함 (권한: ${permissionLevel}): ${cmdName}`);
        } else {
            console.log(`🚫 [CommandsCache] 커맨드 제외 (권한: ${permissionLevel}): ${cmdName}`);
        }
        
        return isAllowed;
    }

    /**
     * 클라이언트에서 커맨드 메타데이터 추출
     * @param {Client} client Discord 클라이언트
     * @returns {Array} 커맨드 메타데이터 배열
     */
    extractCommandsMetadata(client) {
        const commands = [];
        let totalScanned = 0;
        let filteredCount = 0;
        
        try {
            // 슬래시 커맨드 추출
            if (client.slashCommands && client.slashCommands.size > 0) {
                console.log(`📂 [CommandsCache] 슬래시 커맨드 스캔: ${client.slashCommands.size}개`);
                
                client.slashCommands.forEach((command, name) => {
                    try {
                        totalScanned++;
                        
                        // 캐시 대상 확인
                        if (!this.isCacheableCommand(command)) {
                            filteredCount++;
                            return;
                        }
                        
                        const commandMeta = this.parseCommand(command, 'slash');
                        if (commandMeta) {
                            commands.push(commandMeta);
                        }
                    } catch (error) {
                        console.warn(`⚠️ [CommandsCache] 슬래시 커맨드 파싱 실패: ${name}`, error.message);
                    }
                });
            }

            // 프리픽스 커맨드 추출  
            if (client.prefixCommands && client.prefixCommands.size > 0) {
                console.log(`📂 [CommandsCache] 프리픽스 커맨드 스캔: ${client.prefixCommands.size}개`);
                
                client.prefixCommands.forEach((command, name) => {
                    try {
                        // 슬래시 커맨드와 중복되지 않는 경우만 처리
                        const existingCommand = commands.find(c => c.name === name);
                        if (!existingCommand) {
                            totalScanned++;
                            
                            // 캐시 대상 확인
                            if (!this.isCacheableCommand(command)) {
                                filteredCount++;
                                return;
                            }
                            
                            const commandMeta = this.parseCommand(command, 'prefix');
                            if (commandMeta) {
                                commands.push(commandMeta);
                            }
                        }
                    } catch (error) {
                        console.warn(`⚠️ [CommandsCache] 프리픽스 커맨드 파싱 실패: ${name}`, error.message);
                    }
                });
            }
            
            console.log(`✨ [CommandsCache] 커맨드 필터링 완료: ${totalScanned}개 스캔 → ${filteredCount}개 제외 → ${commands.length}개 캐시 대상`);
            
        } catch (error) {
            console.error('❌ [CommandsCache] 커맨드 추출 중 오류:', error);
        }

        return commands;
    }

    /**
     * 단일 커맨드를 메타데이터로 변환
     * @param {Object} command 커맨드 객체
     * @param {string} type 커맨드 타입 ('slash' | 'prefix')
     * @returns {Object} 커맨드 메타데이터
     */
    parseCommand(command, type) {
        try {
            const commandData = command.data || command;
            const name = commandData.name || command.name;
            
            if (!name) {
                console.warn('⚠️ [CommandsCache] 커맨드 이름이 없음, 스킵');
                return null;
            }

            return {
                name: name,
                description: commandData.description || command.description || '설명 없음',
                type: type,
                category: command.category || 'general',
                permissions: command.permissions || command.requiredPermissions || [],
                permissionLevel: command.permissionLevel || -1,
                aliases: command.aliases || [],
                parameters: this.parseParameters(commandData.options || command.options || [])
            };
        } catch (error) {
            console.error('❌ [CommandsCache] 커맨드 파싱 오류:', error);
            return null;
        }
    }

    /**
     * 커맨드 옵션을 파라미터 메타데이터로 변환
     * @param {Array} options Discord 커맨드 옵션들
     * @returns {Array} 파라미터 메타데이터 배열
     */
    parseParameters(options) {
        if (!Array.isArray(options)) {
            return [];
        }

        return options.map(option => {
            try {
                return {
                    name: option.name,
                    type: this.mapDiscordTypeToString(option.type),
                    description: option.description || '설명 없음',
                    required: option.required || false,
                    choices: option.choices?.map(c => ({
                        name: c.name,
                        value: c.value.toString()
                    })) || null
                };
            } catch (error) {
                console.warn('⚠️ [CommandsCache] 파라미터 파싱 실패:', error.message);
                return {
                    name: option.name || 'unknown',
                    type: 'string',
                    description: '파싱 실패',
                    required: false,
                    choices: null
                };
            }
        });
    }

    /**
     * Discord 옵션 타입을 문자열로 매핑
     * @param {number} discordType Discord API 타입 번호
     * @returns {string} 문자열 타입
     */
    mapDiscordTypeToString(discordType) {
        const typeMap = {
            1: 'string',     // SUB_COMMAND
            2: 'string',     // SUB_COMMAND_GROUP  
            3: 'string',     // STRING
            4: 'number',     // INTEGER
            5: 'boolean',    // BOOLEAN
            6: 'user',       // USER
            7: 'channel',    // CHANNEL
            8: 'role',       // ROLE
            9: 'string',     // MENTIONABLE
            10: 'number',    // NUMBER
            11: 'string'     // ATTACHMENT
        };
        return typeMap[discordType] || 'string';
    }

    /**
     * 캐시된 커맨드 데이터 조회 (테스트용)
     * @returns {Object|null} 캐시된 데이터
     */
    async getCachedCommands() {
        try {
            const cachedData = await redisManager.getValue(this.CACHE_KEY);
            return cachedData;
        } catch (error) {
            console.error('❌ [CommandsCache] 캐시 조회 실패:', error);
            return null;
        }
    }

    /**
     * 캐시 강제 갱신 (관리자용)
     * @param {Client} client Discord 클라이언트
     */
    async forceRefresh(client) {
        console.log('🔄 [CommandsCache] 강제 캐시 갱신 시작');
        await this.updateCommandsCache(client);
    }

    /**
     * 캐시 통계 조회
     * @returns {Object} 캐시 통계
     */
    async getCacheStats() {
        try {
            const exists = await redisManager.exists(this.CACHE_KEY);
            if (!exists) {
                return { exists: false, data: null };
            }

            const cachedData = await this.getCachedCommands();
            return {
                exists: true,
                lastUpdated: cachedData?.lastUpdated,
                botStartTime: cachedData?.botStartTime,
                commandCount: cachedData?.commandCount || 0,
                botVersion: cachedData?.botVersion,
                cacheKey: this.CACHE_KEY,
                ttl: 'unlimited', // 무제한 저장 표시
                cachePolicy: '봇 재시작 시에만 갱신'
            };
        } catch (error) {
            console.error('❌ [CommandsCache] 통계 조회 실패:', error);
            return { exists: false, error: error.message };
        }
    }

    /**
     * 백엔드에 캐시 갱신 알림 (Pub/Sub 활용)
     * Spring 백엔드의 Spring Cache를 무효화하도록 신호 전송
     */
    async notifyBackendCacheUpdate() {
        try {
            const notificationData = {
                event: 'bot_commands_cache_updated',
                timestamp: new Date().toISOString(),
                cacheKey: this.CACHE_KEY,
                botVersion: this.botVersion
            };

            // Redis Pub/Sub로 백엔드에 알림
            await redisManager.client.publish('bot:cache:events', JSON.stringify(notificationData));
            console.log('📢 [CommandsCache] 백엔드 캐시 갱신 알림 전송 완료');
            
        } catch (error) {
            console.warn('⚠️ [CommandsCache] 백엔드 알림 전송 실패 (무시 가능):', error.message);
        }
    }
}

module.exports = { CommandsCacheManager };