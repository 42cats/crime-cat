// deploy-commands.js
const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('node:fs');
const path = require('node:path');

dotenv.config();

const globalCommands = [];
const guildCommands = [];

const foldersPath = path.join(__dirname, 'Commands');
console.log('Commands 폴더 경로:', foldersPath);

try {
    const entries = fs.readdirSync(foldersPath, { withFileTypes: true });
    console.log('발견된 엔트리:', entries.map(entry => entry.name));

    for (const entry of entries) {
        const entryPath = path.join(foldersPath, entry.name);
        
        if (entry.isFile() && entry.name.endsWith('.js')) {
            try {
                const command = require(entryPath);
                console.log(`처리 중인 파일: ${entry.name}`);

                if ('data' in command && 'execute' in command && command.upload) {
                    if (command.permissionLevel === -1) {
                        guildCommands.push(command.data.toJSON());
                    } else {
                        globalCommands.push(command.data.toJSON());
                    }
                }
            } catch (loadError) {
                console.error(`파일 로드 오류: ${entryPath}`, loadError);
            }
        }
    }
} catch (readError) {
    console.error('디렉토리 읽기 오류:', readError);
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function deployCommands() {
    try {
        console.log('글로벌 커맨드 수:', globalCommands.length);
        console.log('길드 커맨드 수:', guildCommands.length);

        if (globalCommands.length > 0) {
            console.log('글로벌 커맨드 등록 시작');
            const globalResult = await rest.put(
                Routes.applicationCommands(process.env.APP_ID),
                { body: globalCommands }
            );
            console.log(`글로벌 커맨드 등록 완료: ${globalResult.length}개`);
        }

        if (guildCommands.length > 0) {
            const guildId = process.env.DEV_GUILD_ID;
            console.log(`길드(${guildId}) 커맨드 등록 시작`);
            const guildResult = await rest.put(
                Routes.applicationGuildCommands(process.env.APP_ID, guildId),
                { body: guildCommands }
            );
            console.log(`길드 커맨드 등록 완료: ${guildResult.length}개`);
        }

        console.log('모든 커맨드 등록 완료');
        process.exit(0);
    } catch (error) {
        console.error('커맨드 등록 중 오류:', error);
        process.exit(1);
    }
}

deployCommands();