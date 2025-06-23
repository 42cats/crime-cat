const { PermissionsBitField } = require('discord.js');

/**
 * 모든 액션 실행기의 기본 클래스
 * 액션 타입별 실행기는 이 클래스를 상속받아 구현
 */
class BaseActionExecutor {
    constructor(type) {
        this.type = type;
        this.requiredPermissions = []; // Discord 권한 배열
        this.supportedTargets = ['executor']; // 지원하는 target 타입들
        this.retryable = false; // 실패 시 재시도 가능 여부
        this.rollbackable = false; // 롤백 가능 여부
    }

    /**
     * 액션 유효성 검증
     * @param {Object} action - 실행할 액션
     * @param {Object} context - 실행 컨텍스트
     */
    async validate(action, context) {
        if (!action.type) {
            throw new Error('액션 타입이 지정되지 않았습니다.');
        }

        if (!action.parameters) {
            throw new Error('액션 파라미터가 없습니다.');
        }

        if (!this.supportedTargets.includes(action.target)) {
            throw new Error(`지원하지 않는 대상: ${action.target}. 지원되는 대상: ${this.supportedTargets.join(', ')}`);
        }

        // 컨텍스트 검증
        if (!context.guild) {
            throw new Error('길드 정보가 없습니다.');
        }

        if (!context.member) {
            throw new Error('멤버 정보가 없습니다.');
        }

        if (!context.user) {
            throw new Error('사용자 정보가 없습니다.');
        }
    }

    /**
     * Discord 권한 확인
     * @param {Object} context - 실행 컨텍스트 
     */
    async checkPermissions(context) {
        const botMember = context.guild.members.me;
        
        for (const permission of this.requiredPermissions) {
            if (!botMember.permissions.has(PermissionsBitField.Flags[permission])) {
                throw new Error(`봇에게 필요한 권한이 없습니다: ${permission}`);
            }
        }
    }

    /**
     * 대상 사용자들 해석
     * @param {Object} action - 실행할 액션
     * @param {Object} context - 실행 컨텍스트
     * @returns {Array} 대상 멤버들의 배열
     */
    async resolveTargets(action, context) {
        const targets = [];

        switch (action.target) {
            case 'executor':
                targets.push(context.member);
                break;

            case 'specific':
                if (!action.parameters.targetUserId) {
                    throw new Error('특정 사용자 ID가 지정되지 않았습니다.');
                }
                try {
                    const targetMember = await context.guild.members.fetch(action.parameters.targetUserId);
                    targets.push(targetMember);
                } catch (error) {
                    throw new Error(`사용자를 찾을 수 없습니다: ${action.parameters.targetUserId}`);
                }
                break;

            case 'role':
                // 다중 역할 지원
                const targetRoleIds = action.parameters.targetRoleIds || 
                                    (action.parameters.targetRoleId ? [action.parameters.targetRoleId] : []);
                
                if (targetRoleIds.length === 0) {
                    throw new Error('대상 역할이 지정되지 않았습니다.');
                }

                for (const roleId of targetRoleIds) {
                    try {
                        const targetRole = await context.guild.roles.fetch(roleId);
                        if (!targetRole) {
                            throw new Error(`역할을 찾을 수 없습니다: ${roleId}`);
                        }
                        
                        // 역할을 가진 모든 멤버 추가 (중복 제거)
                        targetRole.members.forEach(member => {
                            if (!targets.find(t => t.id === member.id)) {
                                targets.push(member);
                            }
                        });
                    } catch (error) {
                        throw new Error(`역할 처리 오류 (${roleId}): ${error.message}`);
                    }
                }
                break;

            case 'all':
                // 모든 멤버 (봇 제외)
                const allMembers = await context.guild.members.fetch();
                allMembers.forEach(member => {
                    if (!member.user.bot) {
                        targets.push(member);
                    }
                });
                break;

            case 'channel':
                // 채널 타겟의 경우 실행자만 대상으로 함 (메시지 전송용)
                targets.push(context.member);
                break;

            case 'admin':
                // 관리자 권한을 가진 멤버들
                const adminMembers = await context.guild.members.fetch();
                adminMembers.forEach(member => {
                    if (!member.user.bot && member.permissions.has('Administrator')) {
                        targets.push(member);
                    }
                });
                break;

            default:
                throw new Error(`지원하지 않는 대상 타입: ${action.target}`);
        }

        if (targets.length === 0) {
            throw new Error('적용할 대상을 찾을 수 없습니다.');
        }

        return targets;
    }

    /**
     * 메시지 변수 치환
     * @param {String} message - 원본 메시지
     * @param {Object} context - 실행 컨텍스트
     * @param {Object} actionResult - 액션 실행 결과
     * @returns {String} 치환된 메시지
     */
    processMessageVariables(message, context, actionResult = {}) {
        if (!message) return '';

        return message
            .replace(/{user}/g, `<@${context.user.id}>`)
            .replace(/{username}/g, context.user.username || context.user.displayName)
            .replace(/{guild}/g, context.guild.name)
            .replace(/{channel}/g, `<#${context.channel.id}>`)
            .replace(/{button}/g, context.buttonLabel || '버튼')
            .replace(/{result}/g, actionResult.summary || '완료');
    }

    /**
     * 액션 실행 (추상 메서드)
     * 하위 클래스에서 반드시 구현해야 함
     * @param {Object} action - 실행할 액션
     * @param {Object} context - 실행 컨텍스트
     * @returns {Object} 실행 결과
     */
    async execute(action, context) {
        // 기본 검증
        await this.validate(action, context);
        await this.checkPermissions(context);

        // 실제 액션 실행
        return await this.performAction(action, context);
    }

    /**
     * 실제 액션 수행 (추상 메서드)
     * 하위 클래스에서 반드시 구현해야 함
     * @param {Object} action - 실행할 액션
     * @param {Object} context - 실행 컨텍스트
     * @returns {Object} 실행 결과
     */
    async performAction(action, context) {
        throw new Error(`${this.constructor.name}에서 performAction 메서드를 구현해야 합니다.`);
    }

    /**
     * 액션 롤백 (옵션)
     * 롤백 가능한 액션의 경우 구현
     * @param {Object} action - 원본 액션
     * @param {Object} context - 실행 컨텍스트
     * @param {Object} executionResult - 실행 결과
     * @returns {Object} 롤백 결과
     */
    async rollback(action, context, executionResult) {
        if (!this.rollbackable) {
            return { 
                success: false, 
                reason: 'rollback_not_supported',
                message: '이 액션은 롤백을 지원하지 않습니다.'
            };
        }

        throw new Error(`${this.constructor.name}에서 rollback 메서드를 구현해야 합니다.`);
    }

    /**
     * 실행 결과 포맷팅
     * @param {Boolean} success - 성공 여부
     * @param {Object} data - 결과 데이터
     * @param {String} message - 결과 메시지
     * @param {Error} error - 에러 객체 (실패 시)
     * @returns {Object} 포맷된 결과
     */
    formatResult(success, data = {}, message = '', error = null) {
        const result = {
            success,
            actionType: this.type,
            timestamp: new Date().toISOString(),
            data,
            message
        };

        if (error) {
            result.error = {
                message: error.message,
                stack: error.stack,
                retryable: this.retryable
            };
        }

        return result;
    }

    /**
     * 안전한 Discord API 호출
     * 레이트 리밋 및 에러 처리 포함
     * @param {Function} apiCall - Discord API 호출 함수
     * @param {String} operationName - 작업 이름
     * @returns {*} API 호출 결과
     */
    async safeDiscordApiCall(apiCall, operationName) {
        try {
            return await apiCall();
        } catch (error) {
            // Discord API 에러 분류
            if (error.code === 50013) {
                throw new Error(`권한 부족: ${operationName}`);
            } else if (error.code === 50001) {
                throw new Error(`접근 권한 없음: ${operationName}`);
            } else if (error.code === 10013) {
                throw new Error(`사용자를 찾을 수 없음: ${operationName}`);
            } else if (error.code === 10011) {
                throw new Error(`역할을 찾을 수 없음: ${operationName}`);
            } else if (error.code === 10003) {
                throw new Error(`채널을 찾을 수 없음: ${operationName}`);
            } else if (error.code === 50035) {
                throw new Error(`잘못된 형식: ${operationName}`);
            } else if (error.code === 429) {
                throw new Error(`요청 한도 초과: ${operationName} (잠시 후 다시 시도)`);
            }

            // 기타 에러
            throw new Error(`${operationName} 실패: ${error.message}`);
        }
    }
}

module.exports = { BaseActionExecutor };