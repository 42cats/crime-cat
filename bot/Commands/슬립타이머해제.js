const { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction, Message } = require('discord.js');
const delayedDeleteMessage = require('./utility/deleteMsg');
const redisManager = require('./utility/redis');

const nameOfCommand = "슬립타이머해제";
const description = "현재 설정된 슬립타이머를 해제합니다";

module.exports = {
    data: new SlashCommandBuilder()
        .setName(nameOfCommand)
        .setDescription(description),
    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const timerKey = `sleepTimer:${guildId}:${userId}`;

        try {
            // 타이머 존재 여부 확인
            const timerData = await redisManager.getValue(timerKey);

            if (!timerData) {
                return await interaction.reply({
                    content: "❌ 현재 설정된 슬립타이머가 없습니다.",
                    ephemeral: true
                });
            }

            // 타이머 삭제
            await redisManager.delete(timerKey);

            await interaction.reply({
                content: `✅ 슬립타이머가 해제되었습니다! (${timerData.minutes}분 타이머 취소됨)`,
                ephemeral: false
            });

            console.log(`💤 Sleep timer cancelled: ${interaction.user.displayName} in ${interaction.guild.name}`);

        } catch (error) {
            console.error('❌ Sleep timer cancel error:', error);
            await interaction.reply({
                content: "❌ 슬립타이머 해제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
                ephemeral: true
            });
        }
    },

    prefixCommand: {
        name: nameOfCommand,
        description,
        /**
         * 
         * @param {Message} message 
         * @param {Array} args 
         */
        async execute(message, args) {
            const userId = message.author.id;
            const guildId = message.guild.id;
            const timerKey = `sleepTimer:${guildId}:${userId}`;

            try {
                const timerData = await redisManager.getValue(timerKey);

                if (!timerData) {
                    await message.channel.send("❌ 현재 설정된 슬립타이머가 없습니다.");
                    return delayedDeleteMessage(message);
                }

                await redisManager.delete(timerKey);

                await message.channel.send(`✅ 슬립타이머가 해제되었습니다! (${timerData.minutes}분 타이머 취소됨)`);
                
                console.log(`💤 Sleep timer cancelled: ${message.author.displayName} in ${message.guild.name}`);

            } catch (error) {
                console.error('❌ Sleep timer cancel error:', error);
                await message.channel.send("❌ 슬립타이머 해제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            }

            delayedDeleteMessage(message);
        }
    },
    upload: true,
    permissionLevel: PermissionFlagsBits.Connect,
};