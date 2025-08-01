const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('배포')
        .setDescription('슬래시 명령어를 배포합니다')
        .addStringOption(option =>
            option.setName('범위')
                .setDescription('배포할 명령어의 범위')
                .setRequired(true)
                .addChoices(
                    { name: '전체', value: 'all' },
                    { name: '글로벌 명령어만', value: 'global' },
                    { name: '서버 명령어만', value: 'guild' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // 관리자 권한 확인
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '🚫 이 명령어는 관리자만 사용할 수 있습니다.',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            const deployScope = interaction.options.getString('범위');

            const globalCommands = [];
            const guildCommands = [];

            // 명령어 파일 로드
            const progressEmbed = new EmbedBuilder()
                .setTitle('⏳ 명령어 배포 진행 중...')
                .setDescription('명령어 파일을 로드하는 중입니다.')
                .setColor(0xFFAA00)
                .setTimestamp();

            await interaction.editReply({ embeds: [progressEmbed] });

            // Command 폴더 경로
            const foldersPath = path.join(process.cwd(), 'Commands');

            try {
                const entries = fs.readdirSync(foldersPath, { withFileTypes: true });
                const loadedFiles = [];

                for (const entry of entries) {
                    const entryPath = path.join(foldersPath, entry.name);

                    if (entry.isFile() && entry.name.endsWith('.js')) {
                        try {
                            // 캐시 초기화를 위해 require 캐시 제거
                            delete require.cache[require.resolve(entryPath)];
                            const command = require(entryPath);

                            if ('data' in command && 'execute' in command && command.upload) {
                                if (command.permissionLevel === -1) {
                                    guildCommands.push(command.data.toJSON());
                                } else {
                                    globalCommands.push(command.data.toJSON());
                                }
                                loadedFiles.push(`✅ ${entry.name}`);
                            } else {
                                loadedFiles.push(`⚠️ ${entry.name} (필요한 속성 누락)`);
                            }
                        } catch (loadError) {
                            loadedFiles.push(`❌ ${entry.name} (오류: ${loadError.message})`);
                            console.error(`명령어 로드 오류: ${entryPath}`, loadError);
                        }
                    }
                }

                // 로드 상태 업데이트
                progressEmbed.setDescription(`명령어 파일 로드 완료:\n${loadedFiles.slice(0, 15).join('\n')}${loadedFiles.length > 15 ? `\n...외 ${loadedFiles.length - 15}개` : ''}`);
                progressEmbed.addFields({ name: '명령어 수', value: `전역 명령어: ${globalCommands.length}개\n서버 명령어: ${guildCommands.length}개`, inline: true });

                await interaction.editReply({ embeds: [progressEmbed] });

            } catch (readError) {
                console.error('디렉토리 읽기 오류:', readError);
                return await interaction.editReply({
                    content: `❌ 명령어 폴더를 읽는 중 오류가 발생했습니다: ${readError.message}`
                });
            }

            // REST API 설정
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
            const results = [];

            // 배포 시작
            progressEmbed.setDescription('명령어를 Discord API에 등록하는 중입니다...');
            await interaction.editReply({ embeds: [progressEmbed] });

            // 선택된 범위에 따라 명령어 배포
            if (deployScope === 'all' || deployScope === 'global') {
                if (globalCommands.length > 0) {
                    try {
                        const globalResult = await rest.put(
                            Routes.applicationCommands(process.env.APP_ID),
                            { body: globalCommands }
                        );
                        results.push(`✅ 글로벌 명령어 ${globalResult.length}개 배포 완료`);
                    } catch (error) {
                        results.push(`❌ 글로벌 명령어 배포 실패: ${error.message}`);
                        console.error('글로벌 명령어 배포 오류:', error);
                    }
                } else {
                    results.push('ℹ️ 배포할 글로벌 명령어가 없습니다.');
                }
            }

            if (deployScope === 'all' || deployScope === 'guild') {
                if (guildCommands.length > 0) {
                    try {
                        const guildId = process.env.DEV_GUILD_ID || interaction.guild.id;
                        const guildResult = await rest.put(
                            Routes.applicationGuildCommands(process.env.APP_ID, guildId),
                            { body: guildCommands }
                        );
                        results.push(`✅ 서버 명령어 ${guildResult.length}개 배포 완료 (서버 ID: ${guildId})`);
                    } catch (error) {
                        results.push(`❌ 서버 명령어 배포 실패: ${error.message}`);
                        console.error('서버 명령어 배포 오류:', error);
                    }
                } else {
                    results.push('ℹ️ 배포할 서버 명령어가 없습니다.');
                }
            }

            // 최종 결과 업데이트
            const successEmbed = new EmbedBuilder()
                .setTitle('🚀 명령어 배포 결과')
                .setDescription(results.join('\n'))
                .setColor(results.some(r => r.includes('❌')) ? 0xFF0000 : 0x00FF00)
                .setFooter({ text: '명령어가 등록되기까지 최대 1시간이 소요될 수 있습니다.' })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('명령어 배포 중 오류 발생:', error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ 명령어 배포 실패')
                .setDescription(`명령어 배포 중 오류가 발생했습니다: ${error.message}`)
                .setColor(0xFF0000)
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    // Prefix 명령어 정의
    prefixCommand: {
        name: '배포',
        description: '슬래시 명령어를 배포합니다',
        async execute(message, args) {
            // 관리자 권한 확인
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await message.reply('🚫 이 명령어는 관리자만 사용할 수 있습니다.');
            }

            // 명령어 범위 확인
            let deployScope = 'all';
            if (args.length > 0) {
                if (['all', 'global', 'guild'].includes(args[0].toLowerCase())) {
                    deployScope = args[0].toLowerCase();
                } else {
                    return await message.reply('❌ 유효한 배포 범위가 아닙니다. `all`, `global`, `guild` 중 하나를 입력해주세요.');
                }
            }

            // 배포 시작 메시지
            const processingMsg = await message.reply('⏳ 명령어 배포를 시작합니다...');

            try {
                const globalCommands = [];
                const guildCommands = [];

                // 명령어 파일 로드
                const progressEmbed = new EmbedBuilder()
                    .setTitle('⏳ 명령어 배포 진행 중...')
                    .setDescription('명령어 파일을 로드하는 중입니다.')
                    .setColor(0xFFAA00)
                    .setTimestamp();

                await processingMsg.edit({ content: null, embeds: [progressEmbed] });

                // Command 폴더 경로
                const foldersPath = path.join(process.cwd(), 'Commands');

                try {
                    const entries = fs.readdirSync(foldersPath, { withFileTypes: true });
                    const loadedFiles = [];

                    for (const entry of entries) {
                        const entryPath = path.join(foldersPath, entry.name);

                        if (entry.isFile() && entry.name.endsWith('.js')) {
                            try {
                                // 캐시 초기화를 위해 require 캐시 제거
                                delete require.cache[require.resolve(entryPath)];
                                const command = require(entryPath);

                                if ('data' in command && 'execute' in command && command.upload) {
                                    if (command.permissionLevel === -1) {
                                        guildCommands.push(command.data.toJSON());
                                    } else {
                                        globalCommands.push(command.data.toJSON());
                                    }
                                    loadedFiles.push(`✅ ${entry.name}`);
                                } else {
                                    loadedFiles.push(`⚠️ ${entry.name} (필요한 속성 누락)`);
                                }
                            } catch (loadError) {
                                loadedFiles.push(`❌ ${entry.name} (오류: ${loadError.message})`);
                                console.error(`명령어 로드 오류: ${entryPath}`, loadError);
                            }
                        }
                    }

                    // 로드 상태 업데이트
                    progressEmbed.setDescription(`명령어 파일 로드 완료:\n${loadedFiles.slice(0, 15).join('\n')}${loadedFiles.length > 15 ? `\n...외 ${loadedFiles.length - 15}개` : ''}`);
                    progressEmbed.addFields({ name: '명령어 수', value: `전역 명령어: ${globalCommands.length}개\n서버 명령어: ${guildCommands.length}개`, inline: true });

                    await processingMsg.edit({ embeds: [progressEmbed] });

                } catch (readError) {
                    console.error('디렉토리 읽기 오류:', readError);
                    return await processingMsg.edit({
                        content: `❌ 명령어 폴더를 읽는 중 오류가 발생했습니다: ${readError.message}`,
                        embeds: []
                    });
                }

                // REST API 설정
                const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
                const results = [];

                // 배포 시작
                progressEmbed.setDescription('명령어를 Discord API에 등록하는 중입니다...');
                await processingMsg.edit({ embeds: [progressEmbed] });

                // 선택된 범위에 따라 명령어 배포
                if (deployScope === 'all' || deployScope === 'global') {
                    if (globalCommands.length > 0) {
                        try {
                            const globalResult = await rest.put(
                                Routes.applicationCommands(process.env.APP_ID),
                                { body: globalCommands }
                            );
                            results.push(`✅ 글로벌 명령어 ${globalResult.length}개 배포 완료`);
                        } catch (error) {
                            results.push(`❌ 글로벌 명령어 배포 실패: ${error.message}`);
                            console.error('글로벌 명령어 배포 오류:', error);
                        }
                    } else {
                        results.push('ℹ️ 배포할 글로벌 명령어가 없습니다.');
                    }
                }

                if (deployScope === 'all' || deployScope === 'guild') {
                    if (guildCommands.length > 0) {
                        try {
                            const guildId = process.env.DEV_GUILD_ID || message.guild.id;
                            const guildResult = await rest.put(
                                Routes.applicationGuildCommands(process.env.APP_ID, guildId),
                                { body: guildCommands }
                            );
                            results.push(`✅ 서버 명령어 ${guildResult.length}개 배포 완료 (서버 ID: ${guildId})`);
                        } catch (error) {
                            results.push(`❌ 서버 명령어 배포 실패: ${error.message}`);
                            console.error('서버 명령어 배포 오류:', error);
                        }
                    } else {
                        results.push('ℹ️ 배포할 서버 명령어가 없습니다.');
                    }
                }

                // 최종 결과 업데이트
                const successEmbed = new EmbedBuilder()
                    .setTitle('🚀 명령어 배포 결과')
                    .setDescription(results.join('\n'))
                    .setColor(results.some(r => r.includes('❌')) ? 0xFF0000 : 0x00FF00)
                    .setFooter({ text: '명령어가 등록되기까지 최대 1시간이 소요될 수 있습니다.' })
                    .setTimestamp();

                await processingMsg.edit({ embeds: [successEmbed] });

            } catch (error) {
                console.error('명령어 배포 중 오류 발생:', error);

                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ 명령어 배포 실패')
                    .setDescription(`명령어 배포 중 오류가 발생했습니다: ${error.message}`)
                    .setColor(0xFF0000)
                    .setTimestamp();

                await processingMsg.edit({ content: null, embeds: [errorEmbed] });
            }
        }
    },
    upload: true,
    permissionLevel: -1,
    isCacheCommand: false,
};
