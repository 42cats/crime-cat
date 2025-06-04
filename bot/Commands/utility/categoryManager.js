const { ChannelType, PermissionFlagsBits } = require('discord.js');
const redisManager = require('./redis');

class CategoryManager {
    constructor() {
        this.categoryPrefix = 'daily_category';
        this.defaultTTL = 86400; // 24시간
    }

    /**
     * 오늘 날짜 문자열 생성 (YYYY-MM-DD)
     * @returns {string} 오늘 날짜
     */
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * 날짜별 카테고리명 생성
     * @param {string} date - 날짜 문자열 (YYYY-MM-DD)
     * @returns {string} 카테고리명
     */
    generateCategoryName(date) {
        return `🗓️ ${date} 개인 채널`;
    }

    /**
     * Redis에서 카테고리 ID 조회
     * @param {string} guildId - 길드 ID
     * @param {string} date - 날짜 문자열
     * @returns {Promise<string|null>} 카테고리 ID 또는 null
     */
    async getCachedCategoryId(guildId, date) {
        const key = `${this.categoryPrefix}:${guildId}:${date}`;
        const categoryId = await redisManager.getValue(key);
        console.log(`[카테고리 캐시] ${date} 카테고리 조회: ${categoryId ? '존재함' : '없음'}`);
        return categoryId;
    }

    /**
     * Redis에 카테고리 ID 저장
     * @param {string} guildId - 길드 ID
     * @param {string} date - 날짜 문자열
     * @param {string} categoryId - 카테고리 ID
     */
    async setCachedCategoryId(guildId, date, categoryId) {
        const key = `${this.categoryPrefix}:${guildId}:${date}`;
        await redisManager.setValue(categoryId, this.defaultTTL, key);
        console.log(`[카테고리 캐시] ${date} 카테고리 저장: ${categoryId}`);
    }

    /**
     * 길드에서 특정 이름의 카테고리 찾기
     * @param {import('discord.js').Guild} guild - 길드 객체
     * @param {string} categoryName - 찾을 카테고리명
     * @returns {import('discord.js').CategoryChannel|null} 카테고리 객체 또는 null
     */
    findCategoryByName(guild, categoryName) {
        return guild.channels.cache.find(channel => 
            channel.type === ChannelType.GuildCategory && 
            channel.name === categoryName
        ) || null;
    }

    /**
     * 새 카테고리 생성
     * @param {import('discord.js').Guild} guild - 길드 객체
     * @param {string} categoryName - 생성할 카테고리명
     * @param {string} observerRoleId - 관전자 역할 ID (선택사항)
     * @returns {Promise<import('discord.js').CategoryChannel>} 생성된 카테고리 객체
     */
    async createCategory(guild, categoryName, observerRoleId = null) {
        console.log(`[카테고리 생성] 시작: ${categoryName}`);

        // 기본 권한 설정
        const permissionOverwrites = [
            {
                id: guild.id, // @everyone
                deny: [PermissionFlagsBits.ViewChannel]
            }
        ];

        // 관리자 권한 추가
        const adminRoles = guild.roles.cache.filter(role => 
            role.permissions.has(PermissionFlagsBits.Administrator)
        );

        adminRoles.forEach(adminRole => {
            permissionOverwrites.push({
                id: adminRole.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.ManageRoles
                ]
            });
        });

        // 관전자 역할 권한 추가
        if (observerRoleId) {
            const observerRole = guild.roles.cache.get(observerRoleId);
            if (observerRole) {
                permissionOverwrites.push({
                    id: observerRoleId,
                    allow: [PermissionFlagsBits.ViewChannel]
                });
                console.log(`[카테고리 생성] 관전자 역할 권한 추가: ${observerRole.name}`);
            }
        }

        try {
            const category = await guild.channels.create({
                name: categoryName,
                type: ChannelType.GuildCategory,
                permissionOverwrites
            });

            console.log(`[카테고리 생성] 성공: ${category.name} (${category.id})`);
            return category;

        } catch (error) {
            console.error(`[카테고리 생성] 실패:`, error);
            throw new Error(`카테고리 생성에 실패했습니다: ${error.message}`);
        }
    }

    /**
     * 오늘 날짜의 카테고리 가져오기 또는 생성
     * @param {import('discord.js').Guild} guild - 길드 객체
     * @param {string} observerRoleId - 관전자 역할 ID (선택사항)
     * @returns {Promise<import('discord.js').CategoryChannel>} 카테고리 객체
     */
    async getOrCreateDailyCategory(guild, observerRoleId = null) {
        const today = this.getTodayString();
        const categoryName = this.generateCategoryName(today);

        try {
            // 1. Redis 캐시에서 확인
            let cachedCategoryId = await this.getCachedCategoryId(guild.id, today);
            
            if (cachedCategoryId) {
                try {
                    const cachedCategory = await guild.channels.fetch(cachedCategoryId);
                    if (cachedCategory && cachedCategory.type === ChannelType.GuildCategory) {
                        console.log(`[카테고리] 캐시된 카테고리 사용: ${cachedCategory.name}`);
                        return cachedCategory;
                    }
                } catch (fetchError) {
                    console.warn(`[카테고리] 캐시된 카테고리가 삭제됨: ${cachedCategoryId}`);
                }
            }

            // 2. 길드에서 직접 찾기
            let category = this.findCategoryByName(guild, categoryName);
            
            if (category) {
                console.log(`[카테고리] 기존 카테고리 발견: ${category.name}`);
                // Redis에 다시 캐싱
                await this.setCachedCategoryId(guild.id, today, category.id);
                return category;
            }

            // 3. 새로 생성
            category = await this.createCategory(guild, categoryName, observerRoleId);
            
            // Redis에 캐싱
            await this.setCachedCategoryId(guild.id, today, category.id);
            
            return category;

        } catch (error) {
            console.error(`[카테고리] 처리 중 오류:`, error);
            throw error;
        }
    }

    /**
     * 오래된 빈 카테고리들 정리
     * @param {import('discord.js').Guild} guild - 길드 객체
     * @param {number} daysToKeep - 보관할 일수 (기본 7일)
     * @returns {Promise<number>} 삭제된 카테고리 수
     */
    async cleanupOldCategories(guild, daysToKeep = 7) {
        console.log(`[카테고리 정리] 시작: ${daysToKeep}일 이상 된 빈 카테고리 정리`);
        
        const categories = guild.channels.cache.filter(channel => 
            channel.type === ChannelType.GuildCategory && 
            channel.name.includes('개인 채널')
        );

        let deletedCount = 0;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        for (const category of categories.values()) {
            try {
                // 날짜 패턴 매칭 (YYYY-MM-DD)
                const dateMatch = category.name.match(/(\d{4}-\d{2}-\d{2})/);
                
                if (dateMatch) {
                    const categoryDate = new Date(dateMatch[1]);
                    
                    if (categoryDate < cutoffDate) {
                        // 빈 카테고리인지 확인
                        if (category.children.cache.size === 0) {
                            await category.delete(`자동 정리: ${daysToKeep}일 이상 된 빈 카테고리`);
                            console.log(`[카테고리 정리] 삭제됨: ${category.name}`);
                            deletedCount++;
                        } else {
                            console.log(`[카테고리 정리] 건너뜀 (채널 있음): ${category.name} (${category.children.cache.size}개 채널)`);
                        }
                    }
                }
            } catch (error) {
                console.error(`[카테고리 정리] 오류 (${category.name}):`, error);
            }
        }

        console.log(`[카테고리 정리] 완료: ${deletedCount}개 카테고리 삭제됨`);
        return deletedCount;
    }

    /**
     * 특정 날짜의 카테고리 통계 조회
     * @param {import('discord.js').Guild} guild - 길드 객체
     * @param {string} date - 날짜 문자열 (YYYY-MM-DD, 기본값: 오늘)
     * @returns {Promise<Object>} 카테고리 통계
     */
    async getCategoryStats(guild, date = null) {
        if (!date) date = this.getTodayString();
        
        const categoryName = this.generateCategoryName(date);
        const category = this.findCategoryByName(guild, categoryName);

        if (!category) {
            return {
                exists: false,
                date,
                categoryName,
                channelCount: 0,
                channels: []
            };
        }

        const channels = category.children.cache.map(channel => ({
            name: channel.name,
            id: channel.id,
            createdAt: channel.createdAt
        }));

        return {
            exists: true,
            date,
            categoryName: category.name,
            categoryId: category.id,
            channelCount: channels.length,
            channels
        };
    }
}

module.exports = new CategoryManager();