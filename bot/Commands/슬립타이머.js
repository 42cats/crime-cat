const { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction, Message } = require('discord.js');
const delayedDeleteMessage = require('./utility/deleteMsg');
const redisManager = require('./utility/redis');

const nameOfCommand = "슬립타이머";
const description = "지정한 시간(분) 후 음성 채널에서 자동으로 연결을 해제합니다";

module.exports = {
    data: new SlashCommandBuilder()
        .setName(nameOfCommand)
        .setDescription(description)
        .addNumberOption(option =>
            option
                .setName('분')
                .setDescription('연결을 해제할 시간(분 단위)')
                .setMinValue(1)
                .setMaxValue(1440) // 24시간
                .setRequired(true)
        ),
    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const minutes = interaction.options.getNumber('분');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // 음성 채널에 있는지 확인
        const member = interaction.guild.members.cache.get(userId);
        if (!member.voice.channel) {
            return await interaction.reply({
                content: "❌ 음성 채널에 입장한 후 사용해주세요!",
                ephemeral: true
            });
        }

        try {
            const seconds = minutes * 60;
            const endTime = Date.now() + (seconds * 1000);
            
            // Redis TTL 방식으로 타이머 설정
            const timerKey = `sleepTimer:${guildId}:${userId}`;
            const timerData = {
                userId: userId,
                guildId: guildId,
                minutes: minutes,
                endTime: endTime,
                createdAt: new Date().toISOString(),
                channelName: member.voice.channel.name
            };

            // TTL 설정으로 자동 만료 (Pub/Sub에서 감지)
            await redisManager.setValue(timerData, seconds, timerKey);

            const endTimeUnix = Math.floor(endTime / 1000);
            await interaction.reply({
                content: `💤 **${minutes}분** 후에 음성 채널에서 연결이 해제됩니다.\n⏰ 해제 시간: <t:${endTimeUnix}:T> (<t:${endTimeUnix}:R>)`,
                ephemeral: false
            });

            console.log(`💤 Sleep timer set: ${member.displayName} in ${interaction.guild.name} for ${minutes} minutes`);

        } catch (error) {
            console.error('❌ Sleep timer setup error:', error);
            await interaction.reply({
                content: "❌ 슬립타이머 설정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
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
            if (args.length === 0) {
                await message.channel.send("❌ 사용법: `!슬립타이머 30` (분 단위)");
                return delayedDeleteMessage(message);
            }

            const minutes = parseInt(args[0]);
            if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
                await message.channel.send("❌ 1~1440분 사이의 숫자를 입력해주세요.");
                return delayedDeleteMessage(message);
            }

            const userId = message.author.id;
            const guildId = message.guild.id;
            const member = message.guild.members.cache.get(userId);

            if (!member.voice.channel) {
                await message.channel.send("❌ 음성 채널에 입장한 후 사용해주세요!");
                return delayedDeleteMessage(message);
            }

            try {
                const seconds = minutes * 60;
                const endTime = Date.now() + (seconds * 1000);
                
                const timerKey = `sleepTimer:${guildId}:${userId}`;
                const timerData = {
                    userId: userId,
                    guildId: guildId,
                    minutes: minutes,
                    endTime: endTime,
                    createdAt: new Date().toISOString(),
                    channelName: member.voice.channel.name
                };

                await redisManager.setValue(timerData, seconds, timerKey);

                const endTimeUnix = Math.floor(endTime / 1000);
                await message.channel.send(`💤 **${minutes}분** 후에 음성 채널에서 연결이 해제됩니다.\n⏰ 해제 시간: <t:${endTimeUnix}:T> (<t:${endTimeUnix}:R>)`);
                
                console.log(`💤 Sleep timer set: ${member.displayName} in ${message.guild.name} for ${minutes} minutes`);

            } catch (error) {
                console.error('❌ Sleep timer setup error:', error);
                await message.channel.send("❌ 슬립타이머 설정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            }

            delayedDeleteMessage(message);
        }
    },
    upload: true,
    permissionLevel: PermissionFlagsBits.Connect,
};